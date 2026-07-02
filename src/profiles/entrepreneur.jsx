// src/profiles/entrepreneur/EntrepreneurProfile.jsx

import { useEffect, useState } from "react";
import { MdEdit } from "react-icons/md";
import axiosSecure from "../components/utils/axiosSecure";

import { useAlert } from "../context/AlertContext";
import { useConfirm } from "../context/ConfirmContext";
import { FaCrown } from "react-icons/fa";
import { FiX } from "react-icons/fi";

import { useDispatch, useSelector } from "react-redux";
import { loadUserPosts } from "../redux/slices/postsSlice";
import { fetchUserProfile, setActiveProfileData, clearActiveProfileData, updateProfilePicture } from "../redux/slices/userSlice";
import { resolveMedia } from "../components/utils/mediaUrl";

import UserDetails from "./basicDetails/userDetails";
import UserPosts from "./basicDetails/userPosts";
import EntrepreneurDetails from "./entrepreneurDetails/entrepreneurDetails";
import ModalOverlay from "../components/ui/ModalOverlay";
import UserBadge from "../components/ui/UserBadge";

export default function EntrepreneurProfile({
  profile: propProfile,
  readOnly = false,
  disableSelfFetch = false,
}) {
  const { activeProfileData, data: loggedUser, picVersion } = useSelector((state) => state.user);
  const profile = activeProfileData?.profile || propProfile;

  const dispatch = useDispatch();
  const postView = useSelector((state) => state.postView);

  const { showAlert } = useAlert();
  useConfirm();

  /* --------------------------
      USER + ENTREPRENEUR DATA
  --------------------------- */
  const [entreData, setEntreData] = useState(profile || null);
  const user = entreData?.user || null;
  const [showImageModal, setShowImageModal] = useState(false);

  const isOwnProfile = loggedUser?.username === user?.username;
  const hasSubscription = user?.is_subscribed || (isOwnProfile && loggedUser?.is_subscribed);

  useEffect(() => {
    if (profile) setEntreData(profile);
  }, [profile]);

  /* --------------------------
      POSTS STATE
  --------------------------- */
  useEffect(() => {
    if (!readOnly && user?.username) {
      dispatch(loadUserPosts(user.username));
    }
  }, [readOnly, user?.username, dispatch]);

  useEffect(() => {
    if (!profile || !readOnly) return;
    dispatch(loadUserPosts(profile.user.username));
  }, [profile, readOnly, dispatch]);

  /* --------------------------
      EDIT USER STATE
  --------------------------- */
  const [editUser, setEditUser] = useState(false);
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    if (!editUser || !user) return;
    setEditData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
    });
  }, [editUser, user]);

  /* --------------------------
      FETCH SELF PROFILE
  --------------------------- */
  useEffect(() => {
    if (!disableSelfFetch) {
      axiosSecure.get("/v1/entrepreneurs/me/profile/").then((res) => {
        setEntreData(res.data);
        dispatch(setActiveProfileData({ role: "entrepreneur", profile: res.data }));
        dispatch(fetchUserProfile());
      });
    }

    return () => {
      if (!disableSelfFetch) {
        dispatch(clearActiveProfileData());
      }
    };
  }, [disableSelfFetch, dispatch]);

  /* --------------------------
      SAVE USER
  --------------------------- */
  const handleSaveUser = async () => {
    try {
      await axiosSecure.patch("/v1/auth/me/update/", {
        first_name: editData.first_name,
        last_name: editData.last_name,
        ...(editData.phone ? { phone: editData.phone } : {}),
      });

      try {
        await axiosSecure.patch("/v1/entrepreneurs/me/profile/", {
          first_name: editData.first_name,
          last_name: editData.last_name,
        });
      } catch (err) {
        console.warn("Failed to sync name to entrepreneur model:", err);
      }

      setEntreData((prev) => {
        const updated = {
          ...prev,
          first_name: editData.first_name,
          last_name: editData.last_name,
          user: {
            ...prev.user,
            first_name: editData.first_name,
            last_name: editData.last_name,
            phone: editData.phone ?? prev.user.phone,
          },
        };
        dispatch(setActiveProfileData({ role: "entrepreneur", profile: updated }));
        return updated;
      });

      setEditData({
        first_name: editData.first_name,
        last_name: editData.last_name,
        phone: editData.phone,
      });

      dispatch(fetchUserProfile());
      setEditUser(false);
      showAlert("User details updated!", "success");
    } catch (error) {
      console.error("UPDATE ERROR:", error.response?.data || error);
      showAlert("Failed to update user details", "error");
    }
  };

  /* --------------------------
      PROFILE PIC UPLOAD
  --------------------------- */
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", formData);

      const updated = {
        ...entreData,
        user: res.data.user ?? res.data,
      };
      setEntreData(updated);
      dispatch(setActiveProfileData({ role: "entrepreneur", profile: updated }));
      dispatch(updateProfilePicture(updated.user.profile_picture));
      dispatch(fetchUserProfile());

      showAlert("Profile picture updated!", "success");
    } catch (error) {
      console.error("Entrepreneur profile pic upload error:", error?.response?.data || error);
      showAlert("Failed to upload profile picture", "error");
    }
  };

  /* --------------------------
      RESTORE SCROLL
  --------------------------- */
  useEffect(() => {
    if (postView.from === "entrepreneur-profile") {
      setTimeout(() => window.scrollTo(0, postView.scroll || 0), 50);
    }
  }, [postView]);

  /* --------------------------
      LOADING
  --------------------------- */
  if (!user || !entreData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <span className="text-2xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Loading Profile...</span>
        </div>
      </div>
    );
  }

  /* ===============================
      UI
  =============================== */
  return (
    <div className="min-h-screen bg-background text-foreground lg:h-[calc(100vh-5rem)] lg:min-h-0 lg:overflow-hidden">
      <div className="mx-auto h-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 pb-12 lg:pb-0">
        <div className="grid grid-cols-1 gap-6 lg:h-full lg:grid-cols-12">

          {/* LEFT — PROFILE (own scroll) */}
          <div className="space-y-6 no-scrollbar lg:col-span-5 lg:h-full lg:overflow-y-auto lg:pb-6">

            {/* IDENTITY CARD */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative h-24 bg-gradient-to-br from-primary via-primary-hover to-primary/60">
                <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
              </div>

              <div className="px-5 pb-5">
                <div className="group relative -mt-10 inline-block">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-card ring-4 ring-card">
                    {user.profile_picture ? (
                      <img
                        loading="lazy"
                        src={`${resolveMedia(user.profile_picture)}?v=${picVersion}`}
                        alt="Profile"
                        className="h-full w-full cursor-pointer object-cover transition-transform duration-500 group-hover:scale-105"
                        onClick={() => setShowImageModal(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary text-3xl font-bold text-primary-foreground">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {!readOnly && (
                    <label className="absolute -bottom-2 -right-2 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-foreground text-background shadow-lg transition-colors hover:bg-primary hover:text-primary-foreground">
                      <MdEdit size={14} />
                      <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
                    </label>
                  )}
                </div>

                <h1 className="mt-3 truncate text-lg font-bold tracking-tight text-foreground">
                  {user.first_name || user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.username}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                    @{user?.username}
                  </span>
                  <UserBadge userType="entrepreneur" />
                  {entreData.verified_by_admin && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-2xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      Verified
                    </span>
                  )}
                  {hasSubscription && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-2xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      <FaCrown size={11} /> Premium
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ABOUT */}
            <UserDetails
              editMode={!readOnly && editUser}
              setEditMode={readOnly ? () => { } : setEditUser}
              editData={editData}
              setEditData={readOnly ? () => { } : setEditData}
              handleSave={handleSaveUser}
            />

            <EntrepreneurDetails
              entreData={entreData}
              setEntreData={setEntreData}
            />
          </div>

          {/* RIGHT — POSTS (own scroll) */}
          <div className="no-scrollbar lg:col-span-7 lg:h-full lg:overflow-y-auto lg:pb-6">
            <UserPosts />
          </div>
        </div>
      </div>

      {/* PROFILE PICTURE MODAL */}
      {showImageModal && (
        <ModalOverlay close={() => setShowImageModal(false)}>
          <div className="relative flex animate-pop flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <FiX size={20} />
            </button>
            <img
              loading="lazy"
              src={`${resolveMedia(user.profile_picture)}?v=${picVersion}`}
              alt="Profile Large"
              className="h-72 w-72 rounded-xl object-cover md:h-80 md:w-80"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
