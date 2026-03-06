import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "../store";
import AuthBootstrap from "../../features/auth/AuthBootstrap";

export function AppProvider({ children }) {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthBootstrap>{children}</AuthBootstrap>
      </BrowserRouter>
    </Provider>
  );
}
