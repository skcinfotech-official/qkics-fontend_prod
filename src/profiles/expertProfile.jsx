import { useEffect, useState } from "react";
import { MdEdit, MdOutlineEventAvailable } from "react-icons/md";
import axiosSecure from "../components/utils/axiosSecure";
import { useAlert } from "../context/AlertContext";
import { useConfirm } from "../context/ConfirmContext";
import { FaGraduationCap, FaCrown } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import { loadUserPosts } from "../redux/slices/postsSlice";
import {
  fetchUserProfile,
  setActiveProfileData,
  clearActiveProfileData,
  updateProfilePicture,
} from "../redux/slices/userSlice";
import { resolveMedia } from "../components/utils/mediaUrl";

// Shared Components
import UserDetails from "./basicDetails/userDetails";
import UserPosts from "./basicDetails/userPosts";

import ModalOverlay from "../components/ui/ModalOverlay";
import { Button } from "../components/ui";

// Expert Components
import ExpertDetails from "./expertDetails/expertDetails";
import ExperiencePage from "./expertDetails/expertExperience";
import EducationPage from "./expertDetails/expertEducation";
import CertificationPage from "./expertDetails/expertCertification";
import HonorsPage from "./expertDetails/expertHonors";

export default function ExpertProfile({
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

  const navigate = useNavigate();

  /* --------------------------
      USER + EXPERT STATE
  --------------------------- */
  const [expertData, setExpertData] = useState(profile || null);
  const user = expertData?.user || null;
  const [showImageModal, setShowImageModal] = useState(false);

  const isOwnProfile = loggedUser?.username === user?.username;
  const hasSubscription = user?.is_subscribed || (isOwnProfile && loggedUser?.is_subscribed);

  useEffect(() => {
    if (profile) setExpertData(profile);
  }, [profile]);

  /* --------------------------
      EDIT FORM STATE
  --------------------------- */
  const [editUser, setEditUser] = useState(false);
  const [editExp, setEditExp] = useState(false);

  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
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
      POSTS STATE
  --------------------------- */
  const postsState = useSelector((state) => state.posts.items);
  const [, setPosts] = useState([]);

  useEffect(() => {
    setPosts(postsState);
  }, [postsState]);

  // Load posts for viewed profile
  useEffect(() => {
    if (!expertData || !readOnly) return;
    dispatch(loadUserPosts(expertData.user.username));
  }, [expertData, readOnly, dispatch]);

  // LOAD POSTS FOR OWN EXPERT PROFILE
  useEffect(() => {
    if (readOnly || !expertData?.user?.username) return;
    dispatch(loadUserPosts(expertData.user.username));
  }, [readOnly, expertData?.user?.username, dispatch]);

  /* ---------- RESTORE SCROLL ---------- */
  useEffect(() => {
    if (postView.from === "expert-profile") {
      setTimeout(() => window.scrollTo(0, postView.scroll || 0), 50);
    }
  }, [postView]);

  useEffect(() => {
    if (!disableSelfFetch) {
      axiosSecure.get("/v1/experts/me/profile/").then((res) => {
        setExpertData(res.data);
        dispatch(setActiveProfileData({ role: "expert", profile: res.data }));
        dispatch(fetchUserProfile());
      });
    }

    return () => {
      if (!disableSelfFetch) {
        dispatch(clearActiveProfileData());
      }
    };
  }, [disableSelfFetch, dispatch]);

  /* ---------- SAVE USER ---------- */
  const handleSaveUser = async () => {
    try {
      await axiosSecure.patch("/v1/auth/me/update/", {
        first_name: editData.first_name,
        last_name: editData.last_name,
        ...(editData.phone ? { phone: editData.phone } : {}),
      });

      try {
        await axiosSecure.patch("/v1/experts/me/profile/", {
          first_name: editData.first_name,
          last_name: editData.last_name,
        });
      } catch (err) {
        console.warn("Failed to sync name to expert model:", err);
      }

      setExpertData((prev) => {
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
        dispatch(setActiveProfileData({ role: "expert", profile: updated }));
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
    } catch {
      showAlert("Update failed!", "error");
    }
  };

  /* ---------- SAVE EXPERT ---------- */
  const handleSaveExpert = async () => {
    try {
      const res = await axiosSecure.patch("/v1/experts/me/profile/", {
        headline: expertData.headline,
        primary_expertise: expertData.primary_expertise,
        other_expertise: expertData.other_expertise,
        hourly_rate: expertData.hourly_rate,
      });

      setExpertData((prev) => ({
        ...res.data,
        user: prev.user,
      }));

      setEditExp(false);
      showAlert("Expert profile updated!", "success");
    } catch {
      showAlert("Failed!", "error");
    }
  };

  /* ---------- PROFILE PIC ---------- */
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", formData);

      const updated = {
        ...expertData,
        user: res.data.user ?? res.data,
      };
      setExpertData(updated);

      dispatch(setActiveProfileData({ role: "expert", profile: updated }));
      dispatch(updateProfilePicture(updated.user.profile_picture));
      dispatch(fetchUserProfile());

      showAlert("Profile picture updated!", "success");
    } catch (err) {
      console.error("Expert profile pic upload error:", err?.response?.data || err);
      showAlert("Upload failed!", "error");
    }
  };

  /* ---------- LOADING ---------- */
  if (!expertData || !user) {
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
                      <div className="flex h-full w-full items-center justify-center bg-primary text-4xl font-bold text-primary-foreground">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {!readOnly && (
                    <label className="absolute -bottom-2 -right-2 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-foreground text-background shadow-lg transition-colors hover:bg-primary hover:text-primary-foreground">
                      <MdEdit size={15} />
                      <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {/* NAME + BADGES */}
                <h1 className="mt-3 truncate text-lg font-bold tracking-tight text-foreground">
                  {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                    @{user?.username}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-2xs font-bold uppercase tracking-wide text-primary">
                    <FaGraduationCap size={13} /> Expert
                  </span>
                  {expertData.verified_by_admin && (
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

                <Button
                  fullWidth
                  onClick={() => navigate(readOnly ? `/book-session/${user.uuid}` : "/expert/slots")}
                  className="mt-4"
                >
                  <MdOutlineEventAvailable size={17} />
                  {readOnly ? "Book Slots" : "Manage Slots"}
                </Button>
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

            <ExpertDetails
              expertData={expertData}
              setExpertData={setExpertData}
              editExp={!readOnly && editExp}
              setEditExp={readOnly ? () => { } : setEditExp}
              handleSaveExpert={handleSaveExpert}
            />

            <ExperiencePage
              experiences={expertData.experiences || []}
              setExpertData={setExpertData}
            />

            <EducationPage
              education={expertData.educations || []}
              setExpertData={setExpertData}
            />

            <CertificationPage
              certifications={expertData.certifications || []}
              setExpertData={setExpertData}
            />

            <HonorsPage
              honors_awards={expertData.honors_awards || []}
              setExpertData={setExpertData}
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
