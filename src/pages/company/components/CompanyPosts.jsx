import { useState, useEffect, useRef, useCallback } from "react";
import { FaImage } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import axiosSecure from "../../../components/utils/axiosSecure";
import CompanyPostCard from "./CompanyPostCard";
import { useAlert } from "../../../context/AlertContext";
import ModalOverlay from "../../../components/ui/ModalOverlay";
import ConfirmationAlert from "../../../components/ui/ConfirmationAlert";
import { Button } from "../../../components/ui";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const fieldClass =
  "w-full rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40";

export default function CompanyPosts({ companyId, showCreate = true }) {
  const { showAlert } = useAlert();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postIdToDelete, setPostIdToDelete] = useState(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const observer = useRef();
  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchPosts = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await axiosSecure.get(`/v1/companies/${companyId}/posts/`, {
        params: { page },
      });
      const data = res.data?.results || res.data || [];
      const newPosts = Array.isArray(data) ? data : [];
      setPosts((prev) => (page === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMore(!!res.data.next);
    } catch (err) {
      console.error("Error fetching company posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [companyId, page]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setCreating(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    files.forEach((file) => {
      formData.append("uploaded_files", file);
    });

    try {
      const res = await axiosSecure.post(
        `/v1/companies/${companyId}/posts/create/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setPosts((prev) => [res.data, ...prev]);
      setShowCreateModal(false);
      setTitle("");
      setContent("");
      setFiles([]);
      setPreviews([]);
      showAlert("Post created successfully!", "success");
    } catch (err) {
      console.error("Error creating post:", err);
      showAlert(err.response?.data?.message || "Error creating post", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (post) => {
    setEditPost(post);
    setTitle(post.title || "");
    setContent(post.content || "");
    setFiles([]);
    setPreviews([]);
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setCreating(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    files.forEach((file) => {
      formData.append("uploaded_files", file);
    });
    try {
      const res = await axiosSecure.patch(
        `/v1/companies/posts/${editPost.id}/update/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setPosts((prev) =>
        prev.map((p) => (p.id === editPost.id ? { ...p, ...res.data } : p))
      );
      setShowCreateModal(false);
      setIsEditing(false);
      setEditPost(null);
      setTitle("");
      setContent("");
      setFiles([]);
      setPreviews([]);
      showAlert("Post updated successfully!", "success");
    } catch (err) {
      console.error("Error updating post:", err);
      showAlert(err.response?.data?.message || "Error updating post", "error");
    } finally {
      setCreating(false);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setIsEditing(false);
    setEditPost(null);
    setTitle("");
    setContent("");
    setFiles([]);
    setPreviews([]);
  };

  const handleDeleteClick = (postId) => {
    setPostIdToDelete(postId);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePost = async () => {
    if (!postIdToDelete) return;
    try {
      await axiosSecure.delete(`/v1/companies/posts/${postIdToDelete}/delete/`);
      setPosts((prev) => prev.filter((p) => p.id !== postIdToDelete));
      showAlert("Post deleted successfully!", "success");
    } catch (err) {
      console.error("Error deleting post:", err);
      showAlert(err.response?.data?.message || "Error deleting post", "error");
    } finally {
      setShowDeleteConfirm(false);
      setPostIdToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-foreground">Company Posts</h2>
        {showCreate && (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            Create Post
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5">
        {posts.length > 0 ? (
          posts.map((post, index) => {
            const canModify = showCreate;
            if (posts.length === index + 1) {
              return (
                <div ref={lastPostRef} key={post.id}>
                  <CompanyPostCard post={post} onDelete={handleDeleteClick} onEdit={handleEditClick} isOwner={canModify} />
                </div>
              );
            }
            return <CompanyPostCard key={post.id} post={post} onDelete={handleDeleteClick} onEdit={handleEditClick} isOwner={canModify} />;
          })
        ) : (
          !loading && (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm italic text-muted-foreground">
              No posts found for this company.
            </div>
          )
        )}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        )}
      </div>

      {showCreateModal && (
        <ModalOverlay close={closeModal}>
          <div className="mx-4 w-full max-w-xl animate-pop rounded-2xl border border-border bg-card p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  {isEditing ? "Edit Post" : "Create New Post"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isEditing ? "Update your post title and content." : "Share updates, news, or articles from your company."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={isEditing ? handleUpdatePost : handleCreatePost} className="space-y-4">
              <div>
                <label className={labelClass}>Post Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={fieldClass}
                  placeholder="Enter post title"
                />
              </div>

              <div>
                <label className={labelClass}>Content *</label>
                <textarea
                  required
                  rows="5"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`${fieldClass} resize-none`}
                  placeholder="What's on your mind?..."
                />
              </div>

              <div>
                <label className={labelClass}>Attachments</label>
                <div className="flex flex-wrap gap-3">
                  {previews.map((preview, index) => (
                    <div key={index} className="group relative h-20 w-20 overflow-hidden rounded-xl">
                      <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-all hover:border-primary hover:text-primary">
                    <FaImage size={20} className="mb-1" />
                    <span className="text-3xs font-bold uppercase tracking-wide">Add Media</span>
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button type="submit" loading={creating} disabled={!title.trim() || !content.trim()}>
                  {isEditing ? "Update Post" : "Publish Post"}
                </Button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {showDeleteConfirm && (
        <ConfirmationAlert
          title="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          confirmText="Delete"
          onConfirm={confirmDeletePost}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setPostIdToDelete(null);
          }}
        />
      )}
    </div>
  );
}
