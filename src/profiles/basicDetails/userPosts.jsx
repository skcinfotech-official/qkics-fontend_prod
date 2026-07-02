import { useState, useRef } from "react";
import { savePostViewState } from "../../redux/slices/postViewSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import useLike from "../../components/hooks/useLike";
import CreatePostModal from "../../components/posts/create_post";
import { useConfirm } from "../../context/ConfirmContext";
import { useAlert } from "../../context/AlertContext";
import axiosSecure from "../../components/utils/axiosSecure";
import useClickOutside from "../../components/hooks/useClickOutside";

import { updatePost, addPost, setEditingPost, setCreateModalOpen, removePost } from "../../redux/slices/postsSlice";

import PostCard from "../../components/posts/PostCard";
import ModalOverlay from "../../components/ui/ModalOverlay";
import { Button } from "../../components/ui";
import { getAccessToken } from "../../redux/store/tokenManager";

export default function UserPosts() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: posts, editingPost, isCreateModalOpen: openCreate } = useSelector((state) => state.posts);
  const { data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);

  const profileUser = activeProfile?.profile?.user || activeProfile?.profile || {};
  const isOwnProfile = loggedUser?.username === (profileUser.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;

  const setPosts = (callback) => {
    if (typeof callback === "function") {
      const updatedPosts = callback(posts);
      const changedPost = updatedPosts.find((p, i) => p !== posts[i]);
      if (changedPost) {
        dispatch(updatePost(changedPost));
      }
    }
  };

  const handleSetOpenCreate = (val) => dispatch(setCreateModalOpen(val));
  const handleSetEditingPost = (val) => dispatch(setEditingPost(val));
  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();

  const internalHandleDelete = async (postId) => {
    showConfirm({
      title: "Delete Post?",
      message: "Are you sure you want to delete this post?",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/community/posts/${postId}/`);
          dispatch(removePost(postId));
          showAlert("Post deleted!", "success");
        } catch (err) {
          console.log("Delete failed:", err);
          showAlert("Delete failed!", "error");
        }
      },
    });
  };

  const token = getAccessToken();

  const { handleLike } = useLike(setPosts, token, () => {
    navigate("/login");
  });

  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);
  useClickOutside(menuRef, () => setMenuOpen(null));

  /* -----------------------
      OPEN COMMENTS PAGE
  ------------------------ */
  const handleOpenPost = (postId) => {
    if (!token) return navigate("/login");

    dispatch(
      savePostViewState({
        from: "normal-profile",
        tab: "posts",
        scroll: window.scrollY,
      })
    );

    navigate(`/post/${postId}/comments`);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          {readOnly ? "Posts" : "My Posts"}
        </h2>

        {!readOnly && (
          <Button
            size="sm"
            onClick={() => {
              if (!token) return navigate("/login");
              handleSetEditingPost(null);
              handleSetOpenCreate(true);
            }}
          >
            Create Post
          </Button>
        )}
      </div>

      {!posts || posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={{ ...post, author: post.author || profileUser }}
              loggedUser={loggedUser}
              onLike={(id) => handleLike(id)}
              onDelete={internalHandleDelete}
              onEdit={(p) => {
                handleSetEditingPost(p);
                handleSetOpenCreate(true);
              }}
              onCommentClick={(p) => handleOpenPost(p.id)}
              onTagClick={(tag) => navigate(`/search?q=${tag}&type=posts`)}
              onProfileClick={() => { }}
              showMenu={!readOnly}
            />
          ))}
        </div>
      )}

      {/* POST MODAL */}
      {openCreate && (
        <ModalOverlay close={() => {
          handleSetOpenCreate(false);
          handleSetEditingPost(null);
        }}>
          <CreatePostModal
            post={editingPost}
            onClose={() => {
              handleSetOpenCreate(false);
              handleSetEditingPost(null);
            }}
            onSuccess={(updated) => {
              if (editingPost) {
                dispatch(updatePost(updated));
              } else {
                dispatch(addPost(updated));
              }
            }}
          />
        </ModalOverlay>
      )}
    </div>
  );
}
