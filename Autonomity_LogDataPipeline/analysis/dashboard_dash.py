from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
import plotly.express as px

from dash import Dash, Input, Output, State, callback_context, dcc, html
import dash_bootstrap_components as dbc
from dash.dash_table import DataTable


BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from analytics import load_latest_metrics_snapshot, refresh_metrics_snapshot


APP_TITLE = "Log Data Pipeline Dashboard"


def _format_int(value: Any) -> str:
    try:
        return f"{int(value):,}"
    except Exception:
        return "0"


def _format_float(value: Any, digits: int = 2, suffix: str = "") -> str:
    try:
        if value is None:
            return "N/A"
        return f"{float(value):.{digits}f}{suffix}"
    except Exception:
        return "N/A"


def _to_iso(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, pd.Timestamp):
        return value.to_pydatetime().isoformat() if pd.notna(value) else None
    return value


def _jsonify(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {str(k): _jsonify(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_jsonify(v) for v in obj]
    return _to_iso(obj)


def _frame(records: list[dict] | None) -> pd.DataFrame:
    if not records:
        return pd.DataFrame()
    df = pd.DataFrame(records)
    # Best-effort datetime parsing for common fields
    for col in df.columns:
        name = str(col).lower()
        if any(token in name for token in ["timestamp", "minute", "_at", "time_window"]):
            try:
                df[col] = pd.to_datetime(df[col], errors="ignore", utc=True)
            except Exception:
                pass
    return df


def _kpi_card(title: str, value: str, subtitle: str | None = None, color: str = "primary") -> dbc.Card:
    body = [html.Div(title, className="kpi-title"), html.Div(value, className="kpi-value")]
    if subtitle:
        body.append(html.Div(subtitle, className="kpi-subtitle"))
    return dbc.Card(dbc.CardBody(body), className="kpi-card", color=color, outline=True)


def _figure_base(fig, height: int = 360):
    fig.update_layout(
        height=height,
        margin=dict(l=10, r=10, t=55, b=10),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        template="plotly_white",
    )
    return fig


def _datatable(df: pd.DataFrame, *, page_size: int = 15) -> html.Div:
    if df.empty:
        return dbc.Alert("No data available.", color="secondary", className="mb-0")

    columns = [{"name": str(c), "id": str(c)} for c in df.columns]
    return html.Div(
        DataTable(
            data=df.to_dict("records"),
            columns=columns,
            page_size=page_size,
            sort_action="native",
            filter_action="native",
            style_table={"overflowX": "auto"},
            style_header={
                "backgroundColor": "#0b1220",
                "color": "white",
                "fontWeight": "600",
                "border": "0",
            },
            style_cell={
                "backgroundColor": "white",
                "color": "#0f172a",
                "padding": "10px",
                "border": "1px solid #eef2f7",
                "fontFamily": "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
                "fontSize": "13px",
                "textAlign": "left",
                "maxWidth": 420,
                "whiteSpace": "normal",
            },
            style_data_conditional=[
                {"if": {"row_index": "odd"}, "backgroundColor": "#fbfdff"},
            ],
        ),
        className="table-wrap",
    )


def _empty_state(message: str) -> dbc.Card:
    return dbc.Card(
        dbc.CardBody(
            [
                html.H4("No snapshot found", className="mb-2"),
                html.Div(message, className="text-muted mb-3"),
                html.Div("Use “Refresh analysis” to generate a snapshot from MongoDB `logs_parsed`."),
            ]
        ),
        className="shadow-sm",
    )


app = Dash(
    __name__,
    external_stylesheets=[dbc.themes.DARKLY, dbc.icons.BOOTSTRAP],
    title=APP_TITLE,
    suppress_callback_exceptions=True,
)


app.layout = dbc.Container(
    [
        dcc.Store(id="snapshot-store"),
        dcc.Interval(id="auto-refresh", interval=60_000, n_intervals=0, disabled=False),
        dbc.Navbar(
            dbc.Container(
                [
                    dbc.NavbarBrand(
                        [html.I(className="bi bi-graph-up me-2"), APP_TITLE],
                        className="fw-semibold",
                    ),
                    dbc.Nav(
                        [
                            dbc.NavItem(dbc.NavLink("MongoDB: metrics snapshot", disabled=True)),
                            dbc.NavItem(html.Span(id="generated-at", className="navbar-text ms-3")),
                        ],
                        className="ms-auto",
                        navbar=True,
                    ),
                ]
            ),
            color="dark",
            dark=True,
            className="mb-4 dashboard-navbar",
        ),
        dbc.Row(
            [
                dbc.Col(
                    [
                        dbc.Card(
                            dbc.CardBody(
                                [
                                    html.Div("Controls", className="sidebar-title mb-2"),
                                    dbc.Label("Top N (charts)"),
                                    dcc.Slider(
                                        id="top-n",
                                        min=5,
                                        max=30,
                                        step=1,
                                        value=10,
                                        tooltip={"placement": "bottom", "always_visible": False},
                                    ),
                                    html.Div(className="mb-3"),
                                    dbc.Label("Recent rows (tables)"),
                                    dcc.Slider(
                                        id="recent-limit",
                                        min=50,
                                        max=500,
                                        step=25,
                                        value=100,
                                        tooltip={"placement": "bottom", "always_visible": False},
                                    ),
                                    html.Hr(),
                                    dbc.Checklist(
                                        options=[{"label": "Auto-refresh every 60s", "value": "on"}],
                                        value=["on"],
                                        id="auto-refresh-toggle",
                                        switch=True,
                                    ),
                                    html.Div(className="mb-2"),
                                    dbc.Button(
                                        [html.I(className="bi bi-arrow-repeat me-2"), "Refresh analysis"],
                                        id="refresh-btn",
                                        color="primary",
                                        className="w-100",
                                    ),
                                    html.Div(id="status", className="text-muted small mt-3"),
                                    html.Hr(),
                                    dbc.Label("Time series: source type"),
                                    dcc.Dropdown(
                                        id="source-type",
                                        options=[],
                                        value=None,
                                        placeholder="All sources",
                                        clearable=True,
                                    ),
                                ]
                            ),
                            className="shadow-sm sticky-top",
                        )
                    ],
                    md=3,
                ),
                dbc.Col(
                    [
                        dcc.Loading(
                            type="default",
                            children=html.Div(
                                [
                                    html.Div(id="kpis"),
                                    dbc.Tabs(
                                        [
                                            dbc.Tab(label="Summary", tab_id="tab-summary"),
                                            dbc.Tab(label="Time series", tab_id="tab-timeseries"),
                                            dbc.Tab(label="Entity analysis", tab_id="tab-entities"),
                                            dbc.Tab(label="Tables", tab_id="tab-tables"),
                                        ],
                                        id="tabs",
                                        active_tab="tab-summary",
                                        className="mb-3",
                                    ),
                                    html.Div(id="tab-content"),
                                ]
                            ),
                        )
                    ],
                    md=9,
                ),
            ],
            className="g-3",
        ),
        html.Div(className="my-4"),
        dbc.Row(
            dbc.Col(
                dbc.Alert(
                    [
                        html.Span("Tip: "),
                        html.Span("This dashboard reads precomputed aggregates from MongoDB `metrics`. "),
                        html.Span("To rebuild them, click "),
                        html.Code("Refresh analysis"),
                        html.Span("."),
                    ],
                    color="info",
                    className="mb-0",
                ),
                md=12,
            )
        ),
    ],
    fluid=True,
    className="dashboard-container",
)


@app.callback(
    Output("snapshot-store", "data"),
    Output("generated-at", "children"),
    Output("status", "children"),
    Output("auto-refresh", "disabled"),
    Input("refresh-btn", "n_clicks"),
    Input("auto-refresh", "n_intervals"),
    Input("top-n", "value"),
    Input("recent-limit", "value"),
    Input("auto-refresh-toggle", "value"),
    prevent_initial_call=False,
)
def load_or_refresh_snapshot(n_clicks, n_intervals, top_n, recent_limit, auto_refresh_toggle):
    auto_refresh_enabled = bool(auto_refresh_toggle) and "on" in auto_refresh_toggle
    disabled = not auto_refresh_enabled

    triggered = callback_context.triggered[0]["prop_id"] if callback_context.triggered else ""
    force_refresh = triggered.startswith("refresh-btn.")

    try:
        if force_refresh:
            snapshot = refresh_metrics_snapshot(top_n=int(top_n), recent_limit=int(recent_limit))
            status = "Snapshot rebuilt from MongoDB `logs_parsed`."
        else:
            snapshot = load_latest_metrics_snapshot()
            if not snapshot:
                snapshot = refresh_metrics_snapshot(top_n=int(top_n), recent_limit=int(recent_limit))
                status = "Snapshot was missing; generated a new one."
            else:
                status = "Loaded latest snapshot from MongoDB."
    except Exception as exc:
        return None, "", f"Failed to load snapshot: {exc}", disabled

    # Drop MongoDB ObjectId or other non-JSON-serializable fields
    if isinstance(snapshot, dict):
        snapshot.pop("_id", None)

    generated_at = snapshot.get("generated_at")
    generated_label = f"Generated: {generated_at}" if generated_at else ""
    return _jsonify(snapshot), generated_label, status, disabled


@app.callback(
    Output("source-type", "options"),
    Output("source-type", "value"),
    Input("snapshot-store", "data"),
)
def populate_source_types(snapshot):
    if not snapshot:
        return [], None

    rows = snapshot.get("distributions", {}).get("source_types", []) or []
    df = _frame(rows)
    if df.empty or "source_type" not in df.columns:
        return [], None
    options = [{"label": str(v), "value": str(v)} for v in df["source_type"].astype(str).tolist()]
    return options, None


@app.callback(
    Output("kpis", "children"),
    Output("tab-content", "children"),
    Input("snapshot-store", "data"),
    Input("tabs", "active_tab"),
    Input("source-type", "value"),
)
def render_dashboard(snapshot, active_tab, source_type):
    if not snapshot:
        empty = _empty_state("No metrics snapshot found in MongoDB collection `metrics`.")
        return html.Div(empty), html.Div()

    overview = snapshot.get("overview", {}) or {}
    distributions = snapshot.get("distributions", {}) or {}
    entity_analysis = snapshot.get("entity_analysis", {}) or {}
    errors = snapshot.get("errors", {}) or {}
    alerts = snapshot.get("alerts", []) or []
    recent_logs = snapshot.get("recent_logs", []) or []
    time_series = snapshot.get("time_series", {}) or {}

    kpis = dbc.Row(
        [
            dbc.Col(_kpi_card("Total logs", _format_int(overview.get("total_logs")), color="primary"), md=3),
            dbc.Col(_kpi_card("Errors", _format_int(overview.get("error_count")), color="danger"), md=3),
            dbc.Col(_kpi_card("Warnings", _format_int(overview.get("warning_count")), color="warning"), md=3),
            dbc.Col(_kpi_card("Error rate", _format_float(overview.get("error_rate_pct"), 2, "%"), color="secondary"), md=3),
            dbc.Col(_kpi_card("Active services", _format_int(overview.get("active_services")), color="info"), md=3),
            dbc.Col(_kpi_card("Active components", _format_int(overview.get("active_components")), color="info"), md=3),
            dbc.Col(_kpi_card("Logs / second", _format_float(overview.get("logs_per_second"), 4), color="secondary"), md=3),
            dbc.Col(_kpi_card("Avg latency", _format_float(overview.get("avg_processing_latency_sec"), 4, "s"), color="secondary"), md=3),
        ],
        className="g-3 mb-4",
    )

    if active_tab == "tab-summary":
        levels_df = _frame(distributions.get("levels"))
        services_df = _frame(distributions.get("services"))
        components_df = _frame(distributions.get("components"))
        source_types_df = _frame(distributions.get("source_types"))
        top_messages_df = _frame(errors.get("top_messages"))

        figs = []
        if not levels_df.empty:
            figs.append(dcc.Graph(figure=_figure_base(px.bar(levels_df, x="level", y="count", title="Logs by level"))))
        if not services_df.empty:
            figs.append(dcc.Graph(figure=_figure_base(px.bar(services_df, x="service", y="count", title="Top services"))))
        if not source_types_df.empty:
            figs.append(dcc.Graph(figure=_figure_base(px.pie(source_types_df, names="source_type", values="count", title="Logs by source type"), height=380)))
        if not components_df.empty:
            figs.append(dcc.Graph(figure=_figure_base(px.bar(components_df, x="component", y="count", title="Top components"))))
        if not top_messages_df.empty:
            fig = px.bar(top_messages_df, x="count", y="message", orientation="h", title="Top error messages")
            figs.append(dcc.Graph(figure=_figure_base(fig, height=430)))

        return kpis, dbc.Row([dbc.Col(fig, md=6) for fig in figs], className="g-3")

    if active_tab == "tab-timeseries":
        by_minute = _frame(time_series.get("by_minute"))
        by_minute_by_source = _frame(time_series.get("by_minute_by_source"))

        content = []
        if not by_minute.empty and "minute" in by_minute.columns:
            fig_total = px.line(by_minute, x="minute", y=["total_logs", "error_logs", "warning_logs"], title="Logs over time (per minute)")
            content.append(dcc.Graph(figure=_figure_base(fig_total, height=420)))

            fig_rate = px.area(by_minute, x="minute", y="error_rate_pct", title="Error rate over time (%)")
            content.append(dcc.Graph(figure=_figure_base(fig_rate, height=360)))
        else:
            content.append(dbc.Alert("Time series is not available in the latest snapshot.", color="secondary"))

        if not by_minute_by_source.empty and {"minute", "source_type", "total_logs"}.issubset(by_minute_by_source.columns):
            filtered = by_minute_by_source.copy()
            if source_type:
                filtered = filtered[filtered["source_type"].astype(str) == str(source_type)]
            fig_source = px.line(
                filtered,
                x="minute",
                y="total_logs",
                color="source_type" if not source_type else None,
                title="Logs over time by source type",
            )
            content.append(dcc.Graph(figure=_figure_base(fig_source, height=420)))

        return kpis, html.Div(content, className="d-grid gap-3")

    if active_tab == "tab-entities":
        specs = [
            ("blocks", "blocks_involved", "Most active HDFS blocks"),
            ("hadoop_applications", "applications_involved", "Most active Hadoop applications"),
            ("hadoop_jobs", "jobs_involved", "Most active Hadoop jobs"),
            ("hadoop_containers", "containers_involved", "Most active Hadoop containers"),
            ("ips", "ips_involved", "Most active IPs"),
            ("spark_stages_errors", "stages_involved", "Spark stages with errors"),
            ("spark_tasks_errors", "tasks_involved", "Spark tasks with errors"),
            ("windows_kbs_errors", "kbs_involved", "Windows KBs with errors"),
            ("windows_dlls_errors", "dlls_involved", "Windows DLLs with errors"),
        ]

        charts = []
        for key, column, title in specs:
            df = _frame(entity_analysis.get(key))
            if df.empty or column not in df.columns:
                continue
            fig = px.bar(df, x=column, y="count", title=title)
            charts.append(dbc.Col(dcc.Graph(figure=_figure_base(fig, height=360)), md=6))

        alerts_df = _frame(alerts)
        alerts_block = dbc.Card(
            dbc.CardBody(
                [
                    html.Div("Alerts", className="section-title mb-2"),
                    _datatable(alerts_df, page_size=10),
                ]
            ),
            className="shadow-sm",
        )

        return kpis, html.Div(
            [
                dbc.Row(charts, className="g-3 mb-3"),
                alerts_block,
            ]
        )

    if active_tab == "tab-tables":
        recent_logs_df = _frame(recent_logs)
        recent_errors_df = _frame(errors.get("recent"))
        overview_rows = pd.DataFrame([overview]) if overview else pd.DataFrame()

        return kpis, html.Div(
            [
                dbc.Card(
                    dbc.CardBody(
                        [
                            html.Div("Overview (raw snapshot fields)", className="section-title mb-2"),
                            _datatable(overview_rows, page_size=5),
                        ]
                    ),
                    className="shadow-sm mb-3",
                ),
                dbc.Card(
                    dbc.CardBody(
                        [
                            html.Div("Recent processed logs", className="section-title mb-2"),
                            _datatable(recent_logs_df, page_size=15),
                        ]
                    ),
                    className="shadow-sm mb-3",
                ),
                dbc.Card(
                    dbc.CardBody(
                        [
                            html.Div("Recent errors", className="section-title mb-2"),
                            _datatable(recent_errors_df, page_size=15),
                        ]
                    ),
                    className="shadow-sm",
                ),
            ]
        )

    return kpis, dbc.Alert("Unknown tab.", color="warning")


def main():
    host = os.getenv("DASH_HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8050"))
    debug = os.getenv("DASH_DEBUG", "1").strip().lower() not in {"0", "false", "no", "off"}
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()

