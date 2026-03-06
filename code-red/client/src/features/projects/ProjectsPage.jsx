import { Pencil, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import usePermission from "../auth/usePermission";
import {
  useAddProjectMembersMutation,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectsQuery,
  useUpdateProjectMutation,
} from "./projects.api";
import ProjectMembersModal from "./ProjectMembersModal";
import ProjectModal from "./ProjectModal";

const resolveMemberInfo = (member) => {
  const user = member?.user;
  const memberId =
    typeof user === "string"
      ? user
      : String(user?._id || user?.id || "").trim();
  const memberName = user?.name || user?.email || memberId || "Unknown user";
  const memberRole = member?.role || "developer";

  return { memberId, memberName, memberRole };
};

export default function ProjectsPage() {
  const { data, isLoading, isError } = useGetProjectsQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [addProjectMembers, { isLoading: isAddingMembers }] =
    useAddProjectMembersMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const hasPermission = usePermission();
  const canCreateProject = hasPermission("create_project");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [membersProject, setMembersProject] = useState(null);

  const openCreateModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const openMembersModal = (project) => {
    setMembersProject(project);
    setIsMembersModalOpen(true);
  };

  const handleSaveProject = async (payload) => {
    if (editingProject) {
      await updateProject({ projectId: editingProject._id, payload }).unwrap();
    } else {
      await createProject(payload).unwrap();
    }
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Delete this project?")) {
      return;
    }
    await deleteProject(projectId).unwrap();
  };

  const handleAddMembers = async (members) => {
    if (!membersProject?._id) {
      return;
    }

    await addProjectMembers({ projectId: membersProject._id, members }).unwrap();
    setIsMembersModalOpen(false);
    setMembersProject(null);
  };

  const projects = data?.projects || [];

  return (
    <section className="feature-page">
      <div className="page-header">
        <div>
          <p className="brand-kicker">Projects</p>
          <h2>Team Workspaces</h2>
        </div>
        {canCreateProject && (
          <button
            type="button"
            className="primary-button"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            New Project
          </button>
        )}
      </div>

      {isLoading && <p className="subtle-copy">Loading projects...</p>}
      {isError && <p className="error-copy">Failed to load projects.</p>}

      <div className="project-grid">
        {projects.map((project) => {
          const canManageProject = hasPermission("manage_project", {
            project,
          });
          const canDeleteProject = hasPermission("delete_project", {
            project,
          });

          return (
            <article key={project._id} className="project-card">
              <header>
                <h3>{project.name}</h3>
                <span className="meta-pill">
                  <Users size={14} />
                  {(project.members || []).length} members
                </span>
              </header>

              <p>{project.description || "No project description yet."}</p>

              <div>
                <p className="subtle-copy">Members</p>
                <div className="tag-row">
                  {(project.members || []).length === 0 && (
                    <span className="subtle-copy">No members listed.</span>
                  )}
                  {(project.members || []).map((member, index) => {
                    const { memberId, memberName, memberRole } =
                      resolveMemberInfo(member);

                    return (
                      <span
                        className="tag-chip"
                        key={`${project._id}-${memberId || index}`}
                        title={memberId}
                      >
                        {memberName} ({memberRole})
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="tag-row">
                {(project.tags || []).map((tag) => (
                  <span className="tag-chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>

              {(canManageProject || canDeleteProject) && (
                <footer className="card-actions">
                  {canManageProject && (
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => openMembersModal(project)}
                    >
                      <UserPlus size={14} />
                      Add Members
                    </button>
                  )}
                  {canManageProject && (
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => openEditModal(project)}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  )}
                  {canDeleteProject && (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => handleDelete(project._id)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </footer>
              )}
            </article>
          );
        })}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveProject}
        initialValues={editingProject}
        isLoading={isCreating || isUpdating}
      />

      <ProjectMembersModal
        isOpen={isMembersModalOpen}
        project={membersProject}
        onClose={() => {
          setIsMembersModalOpen(false);
          setMembersProject(null);
        }}
        onSubmit={handleAddMembers}
        isLoading={isAddingMembers}
      />
    </section>
  );
}
