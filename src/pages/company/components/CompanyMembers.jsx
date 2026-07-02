import { useState, useEffect } from "react";
import { FaPlus, FaSearch, FaTrash, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import axiosSecure from "../../../components/utils/axiosSecure";
import { resolveMedia } from "../../../components/utils/mediaUrl";
import ModalOverlay from "../../../components/ui/ModalOverlay";
import { useAlert } from "../../../context/AlertContext";
import ConfirmationAlert from "../../../components/ui/ConfirmationAlert";
import { useSelector } from "react-redux";

export default function CompanyMembers({ companyId, isOwner, onLeaveSuccess }) {
  const { showAlert } = useAlert();
  const { data: loggedUser } = useSelector((state) => state.user);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const currentUserRole = members.find(
    (m) => (m.user?.uuid ?? m.user) === loggedUser?.uuid
  )?.role;
  const isActualOwner = isOwner || currentUserRole?.toLowerCase() === "owner";

  const fetchMembers = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await axiosSecure.get(`/v1/companies/${companyId}/members/`);
      const data = res.data?.results || res.data || [];
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [companyId]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await axiosSecure.get(`/v1/auth/search/?q=${query}`);
      setSearchResults(res.data.results || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const addMember = async (userId) => {
    try {
      const res = await axiosSecure.post(`/v1/companies/${companyId}/members/add/`, {
        user_id: userId,
      });
      setMembers((prev) => [...prev, res.data]);
      setShowSearchModal(false);
      setSearchQuery("");
      setSearchResults([]);
      showAlert("Member added successfully", "success");
    } catch (err) {
      console.error("Error adding member:", err);
      showAlert(err.response?.data?.message || "Error adding member", "error");
    }
  };

  const handleRemoveClick = (member) => {
    setMemberToDelete(member);
    setShowDeleteConfirm(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToDelete) return;
    try {
      const userId = memberToDelete.user?.uuid ?? memberToDelete.user;
      await axiosSecure.delete(`/v1/companies/${companyId}/members/${userId}/remove/`);
      setMembers((prev) => prev.filter((m) => (m.user?.uuid ?? m.user) !== userId));
      showAlert("Member removed successfully", "success");
    } catch (err) {
      console.error("Error removing member:", err);
      showAlert(err.response?.data?.message || "Error removing member", "error");
    } finally {
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
    }
  };

  const confirmLeave = async () => {
    try {
      await axiosSecure.delete(`/v1/companies/${companyId}/members/${loggedUser?.uuid}/remove/`);
      showAlert("You have left the company", "success");
      setShowLeaveConfirm(false);
      onLeaveSuccess?.();
    } catch (err) {
      console.error("Error leaving company:", err);
      showAlert(err.response?.data?.message || "Error leaving company", "error");
      setShowLeaveConfirm(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-2xs font-bold uppercase tracking-wide text-muted-foreground">Members</h3>

        {isActualOwner ? (
          <button
            onClick={() => setShowSearchModal(true)}
            className="rounded-lg bg-primary-soft p-1.5 text-primary transition-all hover:bg-primary hover:text-primary-foreground"
            title="Add Member"
          >
            <FaPlus size={10} />
          </button>
        ) : currentUserRole && (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-danger/10 px-2.5 py-1.5 text-danger transition-all hover:bg-danger hover:text-white"
            title="Leave Company"
          >
            <FaSignOutAlt size={10} />
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-4">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        ) : members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                    {member.user?.profile_picture ? (
                      <img src={resolveMedia(member.user.profile_picture)} alt="Member" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xs font-bold text-muted-foreground">
                        {(member.user?.first_name || member.user?.username || "?")?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground">
                      {member.user?.first_name
                        ? `${member.user.first_name} ${member.user.last_name || ""}`
                        : member.user?.username}
                    </p>
                    <p className="text-3xs font-bold uppercase tracking-wide text-muted-foreground">
                      {member.role || "Member"}
                    </p>
                  </div>
                </div>

                {isActualOwner && member.role?.toLowerCase() !== "owner" && (
                  <button
                    onClick={() => handleRemoveClick(member)}
                    className="ml-2 flex-shrink-0 rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-danger hover:text-white"
                    title="Remove Member"
                  >
                    <FaTrash size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 py-6 text-center">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <FaUserPlus size={22} />
              </div>
            </div>
            <p className="text-xs italic text-muted-foreground">No members assigned to this organization.</p>
          </div>
        )}
      </div>

      {showSearchModal && (
        <ModalOverlay close={() => setShowSearchModal(false)}>
          <div className="mx-4 w-full max-w-md animate-pop rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">Add New Member</h2>
                <p className="mt-1 text-xs text-muted-foreground">Search for users to add to your organization.</p>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="relative mb-4">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-muted/40 py-2.5 pl-10 pr-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40"
                placeholder="Search username, first or last name..."
              />
            </div>

            <div className="custom-scrollbar max-h-[300px] space-y-2 overflow-y-auto pr-1">
              {searching ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-2.5 transition-all hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        {user.profile_picture ? (
                          <img src={resolveMedia(user.profile_picture)} alt="User" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">
                            {user.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{user.first_name} {user.last_name}</p>
                        <p className="text-2xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addMember(user.id)}
                      className="rounded-lg bg-primary p-2.5 text-primary-foreground transition-all hover:bg-primary-hover active:scale-95"
                    >
                      <FaUserPlus size={14} />
                    </button>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="py-10 text-center text-xs italic text-muted-foreground">
                  No users found matching "{searchQuery}"
                </div>
              ) : (
                <div className="py-10 text-center text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                  Start typing to find users
                </div>
              )}
            </div>
          </div>
        </ModalOverlay>
      )}

      {showLeaveConfirm && (
        <ConfirmationAlert
          title="Leave Organization"
          message="Are you sure you want to leave this organization? You will no longer have access to its private dashboard."
          confirmText="Leave"
          onConfirm={confirmLeave}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmationAlert
          title="Remove Member"
          message={`Are you sure you want to remove ${memberToDelete?.user?.first_name
              ? `${memberToDelete.user.first_name} ${memberToDelete.user.last_name || ""}`
              : memberToDelete?.user?.username || "this member"
            }?`}
          confirmText="Remove"
          onConfirm={confirmRemoveMember}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setMemberToDelete(null);
          }}
        />
      )}
    </div>
  );
}
