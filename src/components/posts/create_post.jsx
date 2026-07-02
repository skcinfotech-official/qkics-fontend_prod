import { useState, useEffect } from "react";

import axiosSecure from "../utils/axiosSecure";
import useTags from "../hooks/useTags";
import { useAlert } from "../../context/AlertContext";
import { Button } from "../ui";

function CreatePostModal({ onClose, onSuccess, post, knowledgeHub = false }) {
  const { showAlert } = useAlert();
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!post) return;
    setContent(post.content || "");
  }, [post]);

  const [selectedTags, setSelectedTags] = useState(
    post ? post.tags.map((t) => t.id) : []
  );

  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState(
    post?.media || post?.image
      ? (post.media || [{ file: post.image, media_type: "image", id: "old_image" }])
      : []
  );
  const [deletedMediaIds, setDeletedMediaIds] = useState([]);

  const { tags, loading: loadingTags } = useTags();
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag.id)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag.id));
    } else {
      if (selectedTags.length >= 5) {
        showAlert("Max 5 tags allowed", "warning");
        return;
      }
      setSelectedTags([...selectedTags, tag.id]);
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const allowedImageExt = ["jpg", "jpeg", "png"];
    const allowedVideoExt = ["mp4"];

    const filteredFiles = files.filter((file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");

      if (isImg && allowedImageExt.includes(ext)) return true;
      if (isVid && allowedVideoExt.includes(ext)) return true;

      showAlert(
        `Invalid file: ${file.name}. Only JPG, PNG, JPEG for images and MP4 for videos are supported.`,
        "warning"
      );
      return false;
    });

    if (filteredFiles.length === 0) return;

    if (previews.length + filteredFiles.length > 10) {
      showAlert("Max 10 media files allowed", "warning");
      return;
    }

    setMediaFiles((prev) => [...prev, ...filteredFiles]);

    const newPreviews = filteredFiles.map((file) => ({
      id: `temp-${Date.now()}-${file.name}`,
      file: URL.createObjectURL(file),
      media_type: file.type.startsWith("video/") ? "video" : "image",
      isNew: true,
      originalFile: file,
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeMedia = (mediaToRemove) => {
    if (mediaToRemove.isNew) {
      setMediaFiles((prev) => prev.filter((f) => f !== mediaToRemove.originalFile));
    } else {
      setDeletedMediaIds((prev) => [...prev, mediaToRemove.id]);
    }
    setPreviews((prev) => prev.filter((p) => p.id !== mediaToRemove.id));
  };

  const fetchFreshPost = async (postId) => {
    const res = await axiosSecure.get(`/v1/community/posts/${postId}/`);
    return res.data;
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      return showAlert("Content is required", "warning");
    }

    setLoading(true);

    const PREVIEW_LIMIT = 450;
    const FULL_LIMIT = 10000;

    const trimmedContent = content.trim();
    const normalizedContent = trimmedContent.slice(0, FULL_LIMIT);
    const preview_content = normalizedContent.slice(0, PREVIEW_LIMIT);
    const full_content = normalizedContent;

    try {
      /* ------------------------------------------------
          CASE A: text/tag only edit — JSON PATCH
      ------------------------------------------------ */
      if (post && mediaFiles.length === 0 && deletedMediaIds.length === 0) {
        const payload = {
          title,
          preview_content,
          full_content,
          tags: selectedTags,
          knowledge_hub: knowledgeHub,
        };

        await axiosSecure.patch(
          `/v1/community/posts/${post.id}/`,
          payload,
          { headers: { "Content-Type": "application/json" } }
        );

        const fresh = await fetchFreshPost(post.id);
        showAlert("Post updated!", "success");
        onSuccess(fresh);
        onClose();
        return;
      }

      /* ------------------------------------------------
          CASE B: CREATE or EDIT with media changes.

          DEBUG: Log exactly what is being sent so we can
          confirm what the backend actually receives.
      ------------------------------------------------ */
      const formData = new FormData();

      formData.append("title", title);
      formData.append("preview_content", preview_content);
      formData.append("full_content", full_content);
      formData.append("knowledge_hub", knowledgeHub ? "true" : "false");
      selectedTags.forEach((id) => formData.append("tags", id));

      if (post) {
        // --- EDIT FLOW ---
        // 1. New files to add
        mediaFiles.forEach((file) => {
          formData.append("add_media", file);
        });

        // 2. IDs of existing media to remove (as JSON string)
        const removeIds = deletedMediaIds.filter(id => id !== "old_image");
        if (removeIds.length > 0) {
          formData.append("remove_media_ids", JSON.stringify(removeIds));
        }

        // 3. Clear legacy single image if needed
        if (deletedMediaIds.includes("old_image")) {
          formData.append("image", "");
        }

        // 4. Current order of existing media (as JSON string)
        const reorderData = previews
          .filter(m => !m.isNew && m.id !== "old_image")
          .map((m, index) => ({ id: m.id, order: index }));

        if (reorderData.length > 0) {
          formData.append("reorder_media", JSON.stringify(reorderData));
        }

        await axiosSecure.patch(
          `/v1/community/posts/${post.id}/`,
          formData
        );

        const fresh = await fetchFreshPost(post.id);
        showAlert("Post updated!", "success");
        onSuccess(fresh);
      } else {
        // --- CREATE FLOW ---
        mediaFiles.forEach((file) => {
          formData.append("media_files", file);
        });

        const res = await axiosSecure.post("/v1/community/posts/", formData);
        showAlert("Post created!", "success");
        onSuccess(res.data);
      }

      onClose();
    } catch (err) {
      if (err.response?.data) {
        showAlert("Action failed: " + JSON.stringify(err.response.data), "error");
      } else {
        showAlert("Action failed. Check console.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-10 rounded-2xl shadow-2xl bg-card text-card-foreground border border-border transition-all duration-300 mx-auto"
      >
        <div className="flex justify-between items-start mb-8 text-left">
          <div className="text-left">
            <h2 className="text-2xl font-black tracking-tighter uppercase text-left">
              {post ? "Edit Post" : "Create Post"}
            </h2>
            <p className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground mt-1 text-left">
              Share your thoughts with the community
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-xl flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all"
            aria-label="Close"
          >✕</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-2 block text-left">Post Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-muted/40 transition-all outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="e.g. The future of AI in 2026..."
            />
            <div className="flex justify-end mt-1">
              <span className="text-2xs font-bold text-muted-foreground">{title.length}/200</span>
            </div>
          </div>

          <div>
            <label className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-2 block text-left">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              maxLength={10000}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-muted/40 transition-all outline-none focus:ring-2 focus:ring-ring focus:border-primary resize-none"
              placeholder="What's on your mind?..."
            />
            <div className="flex justify-end mt-1">
              <span className="text-2xs font-bold text-muted-foreground">{content.length}/10000</span>
            </div>
          </div>

          <div>
            <label className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-3 block text-left">Tags (max 5)</label>
            {loadingTags ? (
              <div className="animate-pulse flex gap-2">
                {[1, 2, 3].map(i => <div key={i} className="h-8 w-20 bg-muted rounded-full" />)}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-1.5 rounded-xl border text-2xs font-black uppercase tracking-widest transition-all active:scale-95 ${active
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-muted text-muted-foreground border-border hover:border-foreground/20"
                        }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-3 block text-left">Media attachments</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {previews.map((m) => (
                <div key={m.id} className="relative rounded-xl overflow-hidden border border-border group aspect-square">
                  {m.media_type === "video" ? (
                    <video src={m.file} className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.file} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button
                      onClick={() => removeMedia(m)}
                      className="bg-primary text-primary-foreground text-2xs font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-2xl transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 transition-transform"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl cursor-pointer transition-all aspect-square bg-muted/40 hover:border-primary/50">
                <div className="flex flex-col items-center">
                  <span className="text-xl mb-1">📸</span>
                  <span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">Add Media</span>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.mp4"
                  onChange={handleMediaChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading} disabled={loading}>
              {post ? "Update" : "Publish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePostModal;