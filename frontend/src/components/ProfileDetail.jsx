import React from "react";
import { MdOutlineClose } from "react-icons/md";
import DefaultAvatar from "../assets/boy.png";
import { useDispatch, useSelector } from "react-redux";
import { setProfileDetail } from "../redux/slices/conditionSlice";
import { toast } from "react-toastify";

const ProfileDetail = () => {
	const dispatch = useDispatch();
	const user = useSelector((store) => store.auth);
	const handleUpdate = () => {
		toast.warn("Coming soon");
	};

	return (
		<div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-[#0F172A]/20 p-4 backdrop-blur-[2px]">
			<div className="relative mt-5 h-fit w-[80%] min-w-72 max-w-[1000px] rounded-[28px] border border-[#E5EAF3] bg-white p-3 pt-4 shadow-[0_28px_60px_rgba(15,23,42,0.14)] sm:w-[60%] md:w-[50%] lg:w-[40%]">
				<h2 className="mb-2 w-full text-center text-2xl font-semibold text-[#172033]">
					Profile
				</h2>
				<div className="flex w-full flex-wrap items-center justify-evenly gap-3 py-4">
					<div className="self-end">
						<h3 className="p-1 text-xl font-semibold text-[#172033]">
							Name : {user.firstName} {user.lastName}
						</h3>
						<h3 className="p-1 text-xl font-semibold text-[#172033]">
							Email : {user.email}
						</h3>
						<button
							onClick={() => {
								localStorage.removeItem("token");
								window.location.reload();
							}}
							className="mt-3 hidden rounded bg-red-500 px-4 py-1.5 font-bold text-white hover:bg-red-700 sm:block"
						>
							Logout
						</button>
					</div>
					<div className="flex w-full items-center justify-evenly self-end sm:w-fit sm:flex-col">
						<img
  src={user?.image || DefaultAvatar}
  alt="Profile"
  onError={(e) => {
    e.currentTarget.src = DefaultAvatar;
  }}
  className="h-20 w-20 rounded-md border border-[#E5EAF3] object-cover"
/>
						<div className="flex flex-col">
							<button
								onClick={handleUpdate}
								className="rounded bg-[#2563EB] px-4 py-1.5 font-bold text-white hover:bg-[#1D4ED8] sm:mt-3"
							>
								Update
							</button>
							<button
								onClick={() => {
									localStorage.removeItem("token");
									window.location.reload();
								}}
								className="mt-3 rounded bg-red-500 px-4 py-1.5 font-bold text-white hover:bg-red-700 sm:hidden"
							>
								Logout
							</button>
						</div>
					</div>
				</div>
				<div
					title="Close"
					onClick={() => dispatch(setProfileDetail())}
					className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#F8FAFF] text-[#475569] hover:bg-[#EFF6FF] hover:text-[#172033]"
				>
					<MdOutlineClose size={20} />
				</div>
			</div>
		</div>
	);
};

export default ProfileDetail;
