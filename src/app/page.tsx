"use client";

import { useEffect, useState } from "react";
import { FaDumbbell, FaTrash } from "react-icons/fa";
import { Outfit } from "next/font/google";
import Image from "next/image";
import { Toaster, toast } from "sonner";

// Initialize the Outfit font
const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

// Workout Type
type Workout = {
  id: number;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  createdAt: string; // ISO string format for dates
};

// Confirmation Modal Component
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  workout,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workout: Workout | null;
}) => {
  if (!isOpen || !workout) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 ">
      <div
        className={`${outfit.className} bg-zinc-800 rounded-2xl max-w-md w-full p-6 border border-zinc-600 shadow-xl`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling to backdrop
      >
        <h3 className="text-xl font-bold text-white mb-4">Delete Workout</h3>
        <p className="text-zinc-300 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-white">{workout.exercise}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-xl transition ease-in-out-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition ease-in-out-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Text Input Component
const CustomTextInput = ({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) => (
  <div className="relative">
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      className="peer text-white p-3 text-sm rounded-xl border border-zinc-700 focus:ring-2 focus:ring-zinc-500 outline-none w-full appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
    />
    <label
      htmlFor={id}
      className="absolute text-sm font-semibold text-zinc-400 bg-zinc-950 rounded-3xl px-2 left-3 -top-3 transition ease-in-out-all peer-placeholder-shown:top-3 peer-focus:text-zinc-400"
    >
      {label}
      {required && <span className="text-zinc-500 ml-1">*</span>}
    </label>
  </div>
);

const WorkoutTracker = () => {
  // Workout State with Local Storage
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("workouts");
      return stored ? (JSON.parse(stored) as Workout[]) : [];
    }
    return [];
  });

  const [newWorkout, setNewWorkout] = useState<Omit<Workout, "id">>({
    exercise: "",
    sets: 0,
    reps: 0,
    weight: 0,
    createdAt: new Date().toISOString(),
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);

  // Persist on change
  useEffect(() => {
    localStorage.setItem("workouts", JSON.stringify(workouts));
  }, [workouts]);

  // Add Workout
  const handleAddWorkout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWorkout.exercise.trim()) {
      // Focus on the exercise input and highlight it
      const exerciseInput = document.getElementById("exercise");
      if (exerciseInput) {
        exerciseInput.focus();
      }
      return;
    }

    const id = Date.now();
    setWorkouts([...workouts, { id, ...newWorkout }]);
    setNewWorkout({
      exercise: "",
      sets: 0,
      reps: 0,
      weight: 0,
      createdAt: new Date().toISOString(), // Always use current date/time for new workouts
    });

    // Show toast notification with Sonner
    toast.success("Workout added successfully!");
  };

  // Delete Workout
  const handleDeleteWorkout = (id: number) => {
    const workoutName = workoutToDelete?.exercise || "Workout";
    setWorkouts(workouts.filter((w: Workout) => w.id !== id));
    setModalOpen(false);
    setWorkoutToDelete(null);

    // Show toast notification with Sonner
    toast.success(`${workoutName} deleted successfully`);
  };

  // Show delete confirmation
  const showDeleteConfirmation = (workout: Workout) => {
    setWorkoutToDelete(workout);
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setWorkoutToDelete(null);
  };

  // Group workouts by date
  const groupWorkoutsByDate = () => {
    const grouped: Record<string, Workout[]> = {};

    workouts.forEach((workout) => {
      const date = new Date(workout.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey;

      if (date.toDateString() === today.toDateString()) {
        dateKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = "Yesterday";
      } else {
        dateKey = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(workout);
    });

    // Sort the dates
    return Object.entries(grouped).sort((a, b) => {
      if (a[0] === "Today") return -1;
      if (b[0] === "Today") return 1;
      if (a[0] === "Yesterday") return -1;
      if (b[0] === "Yesterday") return 1;

      // Compare dates for other entries
      const dateA = new Date(a[1][0].createdAt);
      const dateB = new Date(b[1][0].createdAt);
      return dateB.getTime() - dateA.getTime(); // Sort in descending order
    });
  };

  return (
    <>
      {/* Background images */}
      <div className="fixed inset-0 w-full h-full z-10 hidden md:block">
        <div className="w-1/2 h-full absolute left-0 top-0">
          <Image
            src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Man workout"
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="w-1/2 h-full absolute right-0 top-0">
          <Image
            src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Woman workout"
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Mobile background images - stacked vertically */}
      <div className="fixed inset-0 w-full h-full z-10 md:hidden">
        <div className="w-full h-1/2 absolute left-0 top-0">
          <Image
            src="/man-workout.jpg"
            alt="Man workout"
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="w-full h-1/2 absolute left-0 bottom-0">
          <Image
            src="/woman-workout.jpg"
            alt="Woman workout"
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div
        className={`${outfit.className} min-h-screen flex flex-col items-center justify-center relative px-4 sm:px-6 lg:px-8 overflow-auto`}
      >
        {/* Sonner Toaster component */}
        <Toaster position="top-center" theme="dark" />

        <div className="w-full max-w-3xl mx-auto p-6 mt-10 bg-zinc-900/50 backdrop-blur-sm rounded-3xl shadow-lg border border-zinc-700 relative z-20">
          <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 flex items-center gap-3 text-white">
            <FaDumbbell className="text-zinc-400" />
            Workout Tracker
          </h1>
          <p className="text-zinc-400 mb-6 text-sm md:text-base">
            &ldquo;The body achieves what the mind believes.&rdquo;
          </p>

          {/* Form */}
          <div className="flex flex-col gap-6 mb-6">
            {/* Exercise Input Row */}
            <div>
              <CustomTextInput
                id="exercise"
                label="Exercise"
                value={newWorkout.exercise}
                onChange={(e) =>
                  setNewWorkout({ ...newWorkout, exercise: e.target.value })
                }
                required={true}
              />

              {/* Exercise Suggestions */}
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "Push-ups",
                  "Squats",
                  "Bench Press",
                  "Deadlift",
                  "Pull-ups",
                  "Lunges",
                ].map((exercise) => (
                  <button
                    key={exercise}
                    type="button"
                    onClick={() => setNewWorkout({ ...newWorkout, exercise })}
                    className="px-3 py-1 bg-zinc-700 text-zinc-300 text-sm rounded-lg hover:bg-zinc-600 transition ease-in-out-colors"
                  >
                    {exercise}
                  </button>
                ))}
              </div>
            </div>

            {/* Sets, Reps, Weight Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sets Input */}
              <CustomTextInput
                id="sets"
                label="Sets"
                type="number"
                value={newWorkout.sets}
                onChange={(e) =>
                  setNewWorkout({
                    ...newWorkout,
                    sets: parseInt(e.target.value) || 0,
                  })
                }
              />

              {/* Reps Input */}
              <CustomTextInput
                id="reps"
                label="Reps"
                type="number"
                value={newWorkout.reps}
                onChange={(e) =>
                  setNewWorkout({
                    ...newWorkout,
                    reps: parseInt(e.target.value) || 0,
                  })
                }
              />

              {/* Weight Input */}
              <CustomTextInput
                id="weight"
                label="Weight (kilos)"
                type="number"
                value={newWorkout.weight}
                onChange={(e) =>
                  setNewWorkout({
                    ...newWorkout,
                    weight: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <button
            onClick={handleAddWorkout}
            className="flex items-center justify-center w-full p-3 bg-zinc-200 text-black text-lg font-semibold rounded-xl hover:bg-zinc-300/90 transition ease-in-out cursor-pointer"
          >
            Add Workout
          </button>

          {/* Log */}
        </div>
        {/* Workout Log */}
        <div className="w-full max-w-3xl mx-auto p-6 mt-10 mb-10 bg-zinc-900/50 backdrop-blur-sm rounded-3xl shadow-lg border border-zinc-700 relative z-20">
          <h2 className="text-2xl font-bold mb-4 text-zinc-300">Workout Log</h2>
          {workouts.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <p className="text-lg">You have not recorded any workout yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupWorkoutsByDate().map(([dateGroup, dateWorkouts]) => (
                <div key={dateGroup}>
                  <h3 className="text-xl font-semibold text-zinc-300 mb-3 border-b border-zinc-700 pb-2">
                    {dateGroup}
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dateWorkouts.map((workout: Workout) => (
                      <li
                        key={workout.id}
                        className="bg-zinc-700/90 backdrop-blur-sm border border-zinc-600 p-4 rounded-2xl shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-semibold text-white">
                            {workout.exercise}
                          </span>
                          <button
                            onClick={() => showDeleteConfirmation(workout)}
                            className="text-red-400 hover:text-red-300 transition ease-in-out cursor-pointer"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <div className="text-sm text-zinc-300 ml-1 space-y-1">
                          <p>Sets: {workout.sets}</p>
                          <p>Reps: {workout.reps}</p>
                          <p>Weight: {workout.weight} kilos</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={closeModal}
        onConfirm={() =>
          workoutToDelete && handleDeleteWorkout(workoutToDelete.id)
        }
        workout={workoutToDelete}
      />
    </>
  );
};

export default WorkoutTracker;
