import { useEffect, useRef, useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { FaCamera, FaCheck, FaTimes, FaUndo } from "react-icons/fa";
import { LuLoader } from "react-icons/lu";
import DefaultAvatar from "../assets/boy.png";
import { useDispatch, useSelector } from "react-redux";
import { setProfileDetail } from "../redux/slices/conditionSlice";
import { addAuth } from "../redux/slices/authSlice";
import { updateUserInChats } from "../redux/slices/myChatSlice";
import { toast } from "react-toastify";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
];

const ProfileDetail = () => {
	const dispatch = useDispatch();
	const user = useSelector((store) => store.auth);

	const [isEditing, setIsEditing] = useState(false);
	const [firstName, setFirstName] = useState(user?.firstName || "");
	const [lastName, setLastName] = useState(user?.lastName || "");
	const [selectedImage, setSelectedImage] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [isUploading, setIsUploading] = useState(false);

	const fileInputRef = useRef(null);

	// Start edit mode with current user details
	const handleStartEditing = () => {
		setFirstName(user?.firstName || "");
		setLastName(user?.lastName || "");
		handleRemoveSelectedImage();
		setIsEditing(true);
	};

	// Clean up object URL when component unmounts or previewUrl changes
	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	// Handle Image Selection with validation
	const handleImageChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate MIME type
		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			toast.error(
				"Invalid file type. Only JPG, JPEG, PNG, and WEBP formats are allowed."
			);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			return;
		}

		// Validate size (max 5 MB)
		if (file.size > MAX_FILE_SIZE) {
			toast.error("Image size exceeds the 5 MB limit.");
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			return;
		}

		// Clean up existing preview URL
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}

		setSelectedImage(file);
		setPreviewUrl(URL.createObjectURL(file));
	};

	// Revert selected preview back to current profile image
	const handleRemoveSelectedImage = () => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setSelectedImage(null);
		setPreviewUrl(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Cancel editing: restore original fields without modifying backend
	const handleCancel = () => {
		setFirstName(user?.firstName || "");
		setLastName(user?.lastName || "");
		handleRemoveSelectedImage();
		setIsEditing(false);
	};

	// Save profile updates to backend
	const handleSave = async (e) => {
		if (e) e.preventDefault();

		const trimmedFirstName = firstName.trim();
		const trimmedLastName = lastName.trim();

		if (!trimmedFirstName || !trimmedLastName) {
			toast.error("First name and last name are required.");
			return;
		}

		const token = localStorage.getItem("token");
		if (!token) {
			toast.error("Authentication token not found. Please log in again.");
			return;
		}

		setIsUploading(true);

		try {
			const formData = new FormData();
			formData.append("firstName", trimmedFirstName);
			formData.append("lastName", trimmedLastName);

			if (selectedImage) {
				formData.append("image", selectedImage);
			}

			const response = await fetch(
				`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				}
			);

			const json = await response.json();

			if (!response.ok) {
				throw new Error(json.message || "Failed to update profile.");
			}

			// Update Redux state immediately
			dispatch(addAuth(json.data));
			dispatch(updateUserInChats(json.data));

			toast.success(json.message || "Profile updated successfully!");

			// Reset preview and exit edit mode
			handleRemoveSelectedImage();
			setIsEditing(false);
		} catch (error) {
			console.error("Profile update failed:", error);
			toast.error(
				error.message || "Failed to update profile. Please try again."
			);
		} finally {
			setIsUploading(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		window.location.reload();
	};

	return (
		<div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-[#0F172A]/30 p-4 backdrop-blur-[2px]">
			<div className="relative mt-5 h-fit w-full max-w-[500px] rounded-[28px] border border-[#E5EAF3] bg-white p-6 shadow-[0_28px_60px_rgba(15,23,42,0.16)] sm:p-8">
				{/* Close Button */}
				<button
					type="button"
					title="Close"
					onClick={() => dispatch(setProfileDetail())}
					className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#F8FAFF] text-[#475569] transition-colors hover:bg-[#EFF6FF] hover:text-[#172033]"
				>
					<MdOutlineClose size={20} />
				</button>

				{/* Title */}
				<h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-[#172033]">
					{isEditing ? "Edit Profile" : "Profile"}
				</h2>

				{!isEditing ? (
					/* ================= VIEW MODE ================= */
					<div className="flex flex-col items-center">
						{/* Profile Picture */}
						<div className="relative mb-5">
							<img
								src={
									(!user?.image || user.image.includes("icon-library.com"))
										? DefaultAvatar
										: user.image
								}
								alt="Profile"
								onError={(e) => {
									e.currentTarget.src = DefaultAvatar;
								}}
								className="h-24 w-24 rounded-full border-2 border-[#E5EAF3] object-cover shadow-sm sm:h-28 sm:w-28"
							/>
						</div>

						{/* User Info Details */}
						<div className="mb-6 w-full space-y-3 rounded-2xl border border-[#E5EAF3] bg-[#F8FAFF] p-4 text-left">
							<div>
								<span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
									Name
								</span>
								<p className="text-base font-medium text-[#172033]">
									{user?.firstName} {user?.lastName}
								</p>
							</div>

							<div className="border-t border-[#E5EAF3]/70 pt-2">
								<span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
									Email
								</span>
								<p className="text-base font-medium text-[#172033]">
									{user?.email}
								</p>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-end">
							<button
								type="button"
								onClick={handleStartEditing}
								className="w-full cursor-pointer rounded-xl bg-[#2563EB] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1D4ED8] sm:w-auto"
							>
								Edit Profile
							</button>
							<button
								type="button"
								onClick={handleLogout}
								className="w-full cursor-pointer rounded-xl bg-red-500 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-600 sm:w-auto"
							>
								Logout
							</button>
						</div>
					</div>
				) : (
					/* ================= EDIT MODE ================= */
					<form onSubmit={handleSave} className="flex flex-col items-center">
						{/* Editable Profile Picture */}
						<div className="relative mb-4 flex flex-col items-center">
							<div className="relative group">
								<img
									src={
										previewUrl ||
										((!user?.image || user.image.includes("icon-library.com"))
											? DefaultAvatar
											: user.image)
									}
									alt="Profile Preview"
									onError={(e) => {
										e.currentTarget.src = DefaultAvatar;
									}}
									className="h-24 w-24 rounded-full border-2 border-[#BFDBFE] object-cover shadow-md sm:h-28 sm:w-28"
								/>

								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
									title="Change Photo"
									disabled={isUploading}
								>
									<FaCamera size={20} />
									<span className="mt-1 text-[11px] font-medium">
										Change
									</span>
								</button>
							</div>

							<input
								ref={fileInputRef}
								type="file"
								id="profileImageInput"
								name="image"
								accept="image/jpeg,image/jpg,image/png,image/webp"
								className="hidden"
								onChange={handleImageChange}
								disabled={isUploading}
							/>

							{/* Photo selection status / Revert option */}
							<div className="mt-2 flex items-center gap-2">
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="cursor-pointer text-xs font-semibold text-[#2563EB] hover:underline"
									disabled={isUploading}
								>
									{selectedImage ? "Replace Photo" : "Upload Photo"}
								</button>

								{selectedImage && (
									<>
										<span className="text-xs text-[#94A3B8]">•</span>
										<button
											type="button"
											onClick={handleRemoveSelectedImage}
											className="flex cursor-pointer items-center gap-1 text-xs font-medium text-red-500 hover:underline"
											title="Revert to current picture"
											disabled={isUploading}
										>
											<FaUndo size={10} />
											<span>Revert</span>
										</button>
									</>
								)}
							</div>
							<span className="mt-1 text-[11px] text-[#94A3B8]">
								JPG, JPEG, PNG, or WEBP (Max 5 MB)
							</span>
						</div>

						{/* Input Fields */}
						<div className="mb-6 w-full space-y-3.5 text-left">
							<div>
								<label
									htmlFor="firstName"
									className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]"
								>
									First Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="firstName"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
									placeholder="Enter first name"
									className="w-full rounded-xl border border-[#E5EAF3] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#172033] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white"
									disabled={isUploading}
									required
								/>
							</div>

							<div>
								<label
									htmlFor="lastName"
									className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]"
								>
									Last Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									id="lastName"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
									placeholder="Enter last name"
									className="w-full rounded-xl border border-[#E5EAF3] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#172033] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white"
									disabled={isUploading}
									required
								/>
							</div>

							<div>
								<div className="flex items-center justify-between">
									<label
										htmlFor="email"
										className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]"
									>
										Email
									</label>
									<span className="text-[11px] font-medium text-[#94A3B8]">
										Read-only
									</span>
								</div>
								<input
									type="email"
									id="email"
									value={user?.email || ""}
									disabled
									className="w-full cursor-not-allowed rounded-xl border border-[#E5EAF3] bg-[#F1F5F9] px-3.5 py-2.5 text-sm font-normal text-[#64748B] outline-none"
								/>
							</div>
						</div>

						{/* Action Buttons: Save & Cancel */}
						<div className="flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
							<button
								type="button"
								onClick={handleCancel}
								disabled={isUploading}
								className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E5EAF3] bg-white px-5 py-2.5 text-sm font-semibold text-[#475569] shadow-sm transition-all hover:bg-[#F8FAFF] disabled:cursor-not-allowed disabled:opacity-50"
							>
								<FaTimes size={13} />
								<span>Cancel</span>
							</button>

							<button
								type="submit"
								disabled={isUploading}
								className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-75"
							>
								{isUploading ? (
									<>
										<LuLoader className="animate-spin" size={16} />
										<span>Saving...</span>
									</>
								) : (
									<>
										<FaCheck size={13} />
										<span>Save Changes</span>
									</>
								)}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default ProfileDetail;
