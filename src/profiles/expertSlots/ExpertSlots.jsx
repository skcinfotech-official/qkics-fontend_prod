import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchExpertSlots,
  createExpertSlot,
  updateExpertSlot,
  deleteExpertSlot,
} from "../../redux/slices/expertSlotsSlice";

import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";

import SlotForm from "./SlotForm";
import SlotCard from "./SlotCard";
import ModalOverlay from "../../components/ui/ModalOverlay";
import { Button } from "../../components/ui";
import { GoPlus } from "react-icons/go";

export default function ExpertSlots() {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  /* ----------------------------
      REDUX STATE
  ----------------------------- */
  const { data: user } = useSelector((state) => state.user);
  const { items: slots, loading, error } = useSelector(
    (state) => state.expertSlots
  );

  /* ----------------------------
      LOCAL UI STATE
  ----------------------------- */
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  /* ----------------------------
      FETCH SLOTS
  ----------------------------- */
  useEffect(() => {
    if (!user) return;
    if (user.user_type !== "expert") return;
    dispatch(fetchExpertSlots(user.uuid));
  }, [user, dispatch]);

  /* ----------------------------
      CREATE / UPDATE SLOT
  ----------------------------- */
  const handleSave = async (payload, slotUuid = null) => {
    try {
      if (slotUuid) {
        await dispatch(updateExpertSlot({ slotUuid, payload })).unwrap();
        showAlert("Slot updated successfully", "success");
      } else {
        await dispatch(createExpertSlot(payload)).unwrap();
        showAlert("Slot created successfully", "success");
      }

      setShowModal(false);
      setEditingSlot(null);
      dispatch(fetchExpertSlots(user.uuid));
    } catch (err) {
      if (typeof err === "object") {
        const msg =
          err.start_datetime?.[0] ||
          err.non_field_errors?.[0] ||
          "Save failed";
        showAlert(msg, "error");
      } else {
        showAlert(err, "error");
      }
    }
  };

  /* ----------------------------
      DELETE SLOT
  ----------------------------- */
  const handleDelete = (slotUuid) => {
    showConfirm({
      title: "Delete Slot",
      message: "Are you sure you want to delete this slot?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: async () => {
        try {
          await dispatch(deleteExpertSlot(slotUuid)).unwrap();
          showAlert("Slot deleted successfully", "success");
          dispatch(fetchExpertSlots(user.uuid));
        } catch (err) {
          showAlert(typeof err === "string" ? err : "Delete failed", "error");
        }
      },
    });
  };

  const sortedSlots = useMemo(() => {
    return [...slots].sort(
      (a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)
    );
  }, [slots]);

  /* ----------------------------
      UI
  ----------------------------- */
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Manage <span className="text-primary">Booking Slots</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Set your availability for consultation sessions.
            </p>
          </div>

          <Button
            onClick={() => {
              setEditingSlot(null);
              setShowModal(true);
            }}
            className="shrink-0"
          >
            <GoPlus size={18} /> Add Slot
          </Button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">Loading Slots...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/10 p-8 text-center text-danger">
            <p className="font-bold">{error}</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border py-24 text-center">
            <p className="text-base font-bold text-foreground">No Slots Available</p>
            <p className="text-sm text-muted-foreground">Create your first booking slot to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sortedSlots.map((slot) => {
              const slotId = slot.uuid ?? slot.id;
              return (
                <SlotCard
                  key={slotId}
                  slot={{ ...slot, uuid: slotId }}
                  onEdit={() => {
                    setEditingSlot({ ...slot, uuid: slotId });
                    setShowModal(true);
                  }}
                  onDelete={() => handleDelete(slotId)}
                />
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL */}
      {showModal && (
        <ModalOverlay close={() => setShowModal(false)}>
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl md:p-8">
            <SlotForm
              initialData={editingSlot}
              onSave={handleSave}
              onCancel={() => {
                setShowModal(false);
                setEditingSlot(null);
              }}
            />
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
