import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FaEdit, FaTrash, FaSearch, FaFilter, FaPlus, FaTags } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";

export default function TagsTable({ theme }) {
  const isDark = theme === "dark";
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [tags, setTags] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [tagName, setTagName] = useState("");
  const [editTag, setEditTag] = useState(null);

  const [searchText, setSearchText] = useState("");

  /* ----------------------------
        FETCH TAGS
  ---------------------------- */
  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/v1/community/tags/");
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setTags(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load tags", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  /* ----------------------------
        SEARCH FILTER
  ---------------------------- */
  useEffect(() => {
    const s = searchText.toLowerCase();
    const f = tags.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        t.slug.toLowerCase().includes(s)
    );
    setFiltered(f);
  }, [searchText, tags]);

  /* ----------------------------
        ADD TAG
  ---------------------------- */
  const handleAddTag = async (name) => {
    if (!name.trim()) return showAlert("Tag name cannot be empty", "error");

    try {
      const res = await axiosSecure.post("/v1/community/tags/", {
        name: name.trim(),
      });

      const updated = [...tags, res.data];
      setTags(updated);
      setFiltered(updated);

      setShowAddModal(false);
      showAlert("Tag added successfully!", "success");
    } catch (err) {
      showAlert("Failed to add tag", "error");
    }
  };

  /* ----------------------------
        EDIT TAG
  ---------------------------- */
  const handleEditTag = async (name) => {
    if (!editTag || !name.trim()) return;

    try {
      const res = await axiosSecure.put(`/v1/community/tags/${editTag.id}/`, {
        name: name.trim(),
      });

      const updated = tags.map((t) =>
        t.id === editTag.id ? res.data : t
      );

      setTags(updated);
      setFiltered(updated);

      setShowEditModal(false);
      setEditTag(null);

      showAlert("Tag updated successfully!", "success");
    } catch {
      showAlert("Failed to update tag", "error");
    }
  };

  /* ----------------------------
        DELETE TAG
  ---------------------------- */
  const handleDeleteTag = (id) => {
    showConfirm({
      title: "Delete Tag?",
      message: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/community/tags/${id}/`);
          const updated = tags.filter((t) => t.id !== id);

          setTags(updated);
          setFiltered(updated);

          showAlert("Tag deleted!", "success");
        } catch {
          showAlert("Failed to delete tag", "error");
        }
      },
    });
  };

  /* ----------------------------
        MODAL COMPONENT
  ---------------------------- */
  const Modal = ({ title, onClose, onSubmit, placeholder }) => {
    const [localName, setLocalName] = useState(tagName);

    return (
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className={`p-6 rounded-xl w-full max-w-sm border shadow-xl ${isDark
              ? "bg-[#111111] border-gray-800 text-gray-100"
              : "bg-white border-gray-200 text-gray-900"
            }`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-semibold tracking-tight mb-4">{title}</h3>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-gray-400" : "text-gray-700"}`}>Tag Name</label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder={placeholder}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${isDark
                    ? "bg-[#0a0a0a] border-gray-800 text-gray-200 placeholder-gray-600 focus:border-blue-500"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500"
                  }`}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Cancel
              </button>

              <button
                onClick={() => onSubmit(localName)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* =============================================================== */

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? "text-gray-100" : "text-gray-900"}`}>
            Tags Directory
          </h1>
        </div>
        <button
          onClick={() => {
            setTagName("");
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
        >
          <FaPlus /> Add Tag
        </button>
      </div>

      {/* Filters Area */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between items-center ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
        <div className={`relative w-full sm:max-w-md flex items-center`}>
          <FaSearch className={`absolute left-3 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search tags by name or slug..."
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${isDark ? "bg-[#0a0a0a] border-gray-800 text-gray-200 placeholder-gray-600 focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500"
              }`}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm transition-colors duration-200 ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}>
            <FaFilter className="text-xs" /> Filter
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? "border-gray-800 bg-[#111111]" : "border-gray-200 bg-white shadow-sm"}`}>
        {!loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`text-xs uppercase font-semibold ${isDark ? "bg-gray-800/50 text-gray-400 border-b border-gray-800" : "bg-gray-50 text-gray-600 border-b border-gray-200"}`}>
                <tr>
                  <th className="py-4 px-5">Name</th>
                  <th className="py-4 px-5">Slug</th>
                  <th className="py-4 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-200"}`}>
                {filtered.map((tag) => (
                  <tr key={tag.id} className={`transition-colors duration-200 ${isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}>
                    <td className={`py-3 px-5 font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>{tag.name}</td>
                    <td className={`py-3 px-5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{tag.slug}</td>

                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditTag(tag);
                            setTagName(tag.name);
                            setShowEditModal(true);
                          }}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? "text-blue-400 hover:bg-blue-400/10" : "text-blue-600 hover:bg-blue-50"}`}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-600 hover:bg-red-50"}`}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-10 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaTags className={`text-3xl mb-3 ${isDark ? "text-gray-700" : "text-gray-300"}`} />
                        <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>No tags found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading tags...</p>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAddModal && (
        <Modal
          title="Add New Tag"
          placeholder="Enter tag name..."
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTag}
        />
      )}

      {showEditModal && (
        <Modal
          title="Edit Tag"
          placeholder="Update tag name..."
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditTag}
        />
      )}
    </div>
  );
}
