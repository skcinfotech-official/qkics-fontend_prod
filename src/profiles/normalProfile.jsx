// src/profiles/normalProfile.jsx
import { useEffect, useState } from "react";
import { MdEdit, MdOutlineUpgrade } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaRocket, FaGraduationCap, FaCrown } from "react-icons/fa";
import { FiX } from "react-icons/fi";

import axiosSecure from "../components/utils/axiosSecure";
import { useAlert } from "../context/AlertContext";

// Redux
import { loadUserPosts } from "../redux/slices/postsSlice";
import {
  fetchUserProfile,
  setActiveProfileData,
  clearActiveProfileData,
  updateProfilePicture,
} from "../redux/slices/userSlice";
import { resolveMedia } from "../components/utils/mediaUrl";

// UI Components
import UserDetails from "../profiles/basicDetails/userDetails";
import UserPosts from "../profiles/basicDetails/userPosts";
import UserBadge from "../components/ui/UserBadge";
import ModalOverlay from "../components/ui/ModalOverlay";
import { Button } from "../components/ui";
import useModalEscape from "../components/hooks/useModalEscape";

export default function NormalProfile({
  profile: propProfile,
  readOnly = false,
  disableSelfFetch = false,
}) {
  const { activeProfileData, data: loggedUser, picVersion } = useSelector((state) => state.user);
  const profile = activeProfileData?.profile || propProfile;

  const profileUser = profile?.user || profile || {};
  const isOwnProfile = loggedUser?.username === profileUser.username;
  const hasSubscription = profileUser.is_subscribed || (isOwnProfile && loggedUser?.is_subscribed);

  const { showAlert } = useAlert();

  const [showImageModal, setShowImageModal] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const postView = useSelector((state) => state.postView);

  /* -------------------------------
      USER + EDIT FORM STATE
  ------------------------------- */
  const [profileState, setProfileState] = useState(profile || null);

  useEffect(() => {
    if (profile) setProfileState(profile);
  }, [profile]);

  const [editMode, setEditMode] = useState(false);

  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  /* -------------------------------
      LOAD USER + DISPATCH POSTS
  ------------------------------- */
  useEffect(() => {
    if (disableSelfFetch) return;

    const loadProfile = async () => {
      try {
        const userRes = await axiosSecure.get("/v1/auth/me/");
        const user = userRes.data;

        setProfileState(user);
        dispatch(setActiveProfileData({ role: "normal", profile: user }));

        setEditData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          phone: user.phone || "",
        });

        dispatch(loadUserPosts(user.username));
        dispatch(fetchUserProfile());
      } catch (err) {
        console.log("Profile load error:", err);
      }
    };

    loadProfile();

    return () => {
      if (!disableSelfFetch) {
        dispatch(clearActiveProfileData());
      }
    };
  }, [disableSelfFetch, dispatch]);

  /* -------------------------------
      SAVE USER INFO
  ------------------------------- */
  const handleSaveUser = async () => {
    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", {
        first_name: editData.first_name,
        last_name: editData.last_name,
        ...(editData.phone ? { phone: editData.phone } : {}),
      });

      const savedUser = res.data.user ?? res.data;
      setProfileState(savedUser);

      dispatch(setActiveProfileData({ role: "normal", profile: savedUser }));

      setEditData({
        first_name: savedUser.first_name || "",
        last_name: savedUser.last_name || "",
        email: savedUser.email || "",
        phone: savedUser.phone || "",
      });

      dispatch(fetchUserProfile());

      setEditMode(false);
      showAlert("Profile updated successfully!", "success");
    } catch {
      showAlert("Failed updating profile", "error");
    }
  };

  /* -------------------------------
      UPDATE PROFILE PICTURE
  ------------------------------- */
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", formData);

      const updatedUser = res.data.user ?? res.data;
      setProfileState(updatedUser);

      dispatch(setActiveProfileData({ role: "normal", profile: updatedUser }));
      dispatch(updateProfilePicture(updatedUser.profile_picture));
      dispatch(fetchUserProfile());

      showAlert("Profile picture updated!", "success");
    } catch (err) {
      console.error("Normal profile pic upload error:", err?.response?.data || err);
      showAlert("Upload failed!", "error");
    }
  };

  // Restore scroll IF coming back from comments
  useEffect(() => {
    if (postView.from === "normal-profile") {
      setTimeout(() => {
        window.scrollTo(0, postView.scroll || 0);
      }, 50);
    }
  }, [postView]);

  useEffect(() => {
    if (!profile || !readOnly) return;

    setEditData({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
    });
  }, [profile, readOnly]);

  useEffect(() => {
    if (!profile || !readOnly) return;

    dispatch(loadUserPosts(profile.username));
  }, [profile, readOnly, dispatch]);

  /* -------------------------------
      LOADING STATE
  ------------------------------- */
  if (!profileUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <span className="text-2xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Loading Profile...</span>
        </div>
      </div>
    );
  }

  /* -------------------------------
      MAIN UI
  ------------------------------- */
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
                    {profileUser.profile_picture ? (
                      <img
                        loading="lazy"
                        src={`${resolveMedia(profileUser.profile_picture)}?v=${picVersion}`}
                        alt="Profile"
                        className="h-full w-full cursor-pointer object-cover transition-transform duration-500 group-hover:scale-105"
                        onClick={() => setShowImageModal(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary text-3xl font-bold text-primary-foreground">
                        {profileUser?.first_name
                          ? profileUser.first_name.charAt(0).toUpperCase()
                          : profileUser?.username?.charAt(0).toUpperCase()}
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
                  {profileUser.first_name || profileUser.last_name
                    ? `${profileUser.first_name} ${profileUser.last_name}`
                    : profileUser.username}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                    @{profileUser?.username}
                  </span>
                  <UserBadge userType={profileUser.user_type || "normal"} />
                  {hasSubscription && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-2xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      <FaCrown size={11} /> Premium
                    </span>
                  )}
                </div>

                {!readOnly && (
                  <Button fullWidth onClick={() => setShowUpgradeModal(true)} className="mt-4">
                    <MdOutlineUpgrade size={17} />
                    Upgrade Profile
                  </Button>
                )}
              </div>
            </div>

            {/* ABOUT */}
            <UserDetails
              editMode={!readOnly && editMode}
              setEditMode={readOnly ? () => { } : setEditMode}
              editData={editData}
              setEditData={readOnly ? () => { } : setEditData}
              handleSave={handleSaveUser}
            />
          </div>

          {/* RIGHT — POSTS (own scroll) */}
          <div className="no-scrollbar lg:col-span-7 lg:h-full lg:overflow-y-auto lg:pb-6">
            <UserPosts />
          </div>
        </div>
      </div>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <UpgradeModal close={() => setShowUpgradeModal(false)} navigate={navigate} />
      )}

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
              src={`${resolveMedia(profileUser.profile_picture)}?v=${picVersion}`}
              alt="Profile"
              className="h-72 w-72 rounded-xl object-cover md:h-80 md:w-80"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

/* ----------------------------------------------------
   UPGRADE MODAL
---------------------------------------------------- */
function UpgradeModal({ close, navigate }) {
  useModalEscape(close);
  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl animate-scaleIn rounded-2xl border border-border bg-card p-6 shadow-2xl md:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Upgrade Your Profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose how you want to contribute to the ecosystem.</p>
          </div>
          <button
            onClick={close}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div
            onClick={() => {
              close();
              navigate("/upgrade/expert");
            }}
            className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <FaGraduationCap size={22} />
            </div>
            <h3 className="mb-1 text-base font-bold text-foreground">Become an Expert</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">Share your specialized knowledge, offer consultations, and mentor others in your field.</p>
          </div>

          <div
            onClick={() => {
              close();
              navigate("/upgrade/entrepreneur");
            }}
            className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background transition-transform group-hover:scale-105">
              <FaRocket size={22} />
            </div>
            <h3 className="mb-1 text-base font-bold text-foreground">Become an Entrepreneur</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">Build your startup profile, showcase your innovations, and connect with investors.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
