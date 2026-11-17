import { useEffect, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { setSendLoading, setTyping } from "../../redux/slices/conditionSlice";
import {
	addNewMessage,
	addNewMessageId,
} from "../../redux/slices/messageSlice";
import { LuLoader } from "react-icons/lu";
import { toast } from "react-toastify";
import socket from "../../socket/socket";

let lastTypingTime;
const MessageSend = ({ chatId }) => {
	const [newMessage, setMessage] = useState("");
	const dispatch = useDispatch();
	const isSendLoading = useSelector(
		(store) => store?.condition?.isSendLoading
	);
	const isSocketConnected = useSelector(
		(store) => store?.condition?.isSocketConnected
	);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const isTyping = useSelector((store) => store?.condition?.isTyping);

	useEffect(() => {
		socket.on("typing", () => dispatch(setTyping(true)));
		socket.on("stop typing", () => dispatch(setTyping(false)));
	}, [dispatch]);

	// Send Message Api call
	const handleSendMessage = async () => {
		if (newMessage?.trim() && !isSendLoading) {
			const message = newMessage?.trim();
			setMessage("");
			socket.emit("stop typing", selectedChat._id);
			dispatch(setSendLoading(true));
			const token = localStorage.getItem("token");
			fetch(`${import.meta.env.VITE_BACKEND_URL}/api/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					message: message,
					chatId: chatId,
				}),
			})
				.then((res) => res.json())
				.then((json) => {
					dispatch(addNewMessageId(json?.data?._id));
					dispatch(addNewMessage(json?.data));
					socket.emit("new message", json.data);
					dispatch(setSendLoading(false));
				})
				.catch((err) => {
					console.log(err);
					dispatch(setSendLoading(false));
					toast.error("Message Sending Failed");
				});
		}
	};

	const handleTyping = (e) => {
		setMessage(e.target?.value);
		if (!isSocketConnected) return;
		if (!isTyping) {
			socket.emit("typing", selectedChat._id);
		}
		lastTypingTime = new Date().getTime();
		let timerLength = 3000;
		let stopTyping = setTimeout(() => {
			let timeNow = new Date().getTime();
			let timeDiff = timeNow - lastTypingTime;
			if (timeDiff > timerLength) {
				socket.emit("stop typing", selectedChat._id);
			}
		}, timerLength);
		return () => clearTimeout(stopTyping);
	};

	return (
		<>
			<form
				className="flex h-[88px] w-full items-center gap-2 border-t border-[#E5EAF3] bg-white p-3 text-[#172033]"
				onSubmit={(e) => {
					e.preventDefault();
					handleSendMessage();
				}}
			>
				<input
					type="text"
					className="w-full rounded-full border border-[#E5EAF3] bg-[#F8FAFF] px-4 py-3 text-sm text-[#172033] outline-none placeholder:text-[#94A3B8] focus:border-[#BFDBFE] focus:bg-white"
					placeholder="Type a message"
					value={newMessage}
					onChange={(e) => handleTyping(e)}
				/>
				<span className="flex items-center justify-center">
					{newMessage?.trim() && !isSendLoading && (
						<button
							type="submit"
							className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#2563EB] text-white shadow-[0_12px_24px_rgba(37,99,235,0.25)] transition-all hover:bg-[#1D4ED8]"
							title="Send"
						>
							<FaPaperPlane
								title="Send"
								size={16}
								className="active:scale-75"
							/>
						</button>
					)}
					{isSendLoading && (
						<button
							type="button"
							className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-[0_12px_24px_rgba(37,99,235,0.25)]"
							disabled
						>
							<LuLoader
								title="loading..."
								fontSize={16}
								className="animate-spin"
							/>
						</button>
					)}
				</span>
			</form>
		</>
	);
};

export default MessageSend;
