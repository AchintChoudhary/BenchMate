import { createSlice } from "@reduxjs/toolkit";

const myChatSlice = createSlice({
	name: "myChat",
	initialState: {
		chat: [],
		selectedChat: null,
		newMessageRecieved: [],
	},
	reducers: {
		addMyChat: (state, action) => {
			state.chat = action.payload;
		},
		addSelectedChat: (state, action) => {
			state.selectedChat = action.payload;
			const newMessageRecieved = state.newMessageRecieved.filter(
				(message) => message.chat._id !== action.payload._id
			);
			state.newMessageRecieved = newMessageRecieved;
		},
		addNewChat: (state, action) => {
			const isExistChat = state.chat.find(
				(chat) => chat._id === action.payload._id
			);
			if (!isExistChat) {
				state.chat = [action.payload, ...state.chat];
			}
		},
		deleteSelectedChat: (state, action) => {
			if (
				state.selectedChat &&
				state.selectedChat._id === action.payload
			) {
				state.selectedChat = null;
			}
			const allChat = state.chat.filter(
				(chat) => chat._id !== action.payload
			);
			state.chat = allChat;
		},
		addNewMessageRecieved: (state, action) => {
			if (!state.newMessageRecieved.includes(action.payload)) {
				state.newMessageRecieved = [
					action.payload,
					...state.newMessageRecieved,
				];
			}
		},
		removeNewMessageRecieved: (state, action) => {
			const newMessageRecieved = state.newMessageRecieved.filter(
				(message) => message.chat._id !== action.payload.chat._id
			);
			state.newMessageRecieved = newMessageRecieved;
		},
		updateUserInChats: (state, action) => {
			const updatedUser = action.payload;
			if (!updatedUser || !updatedUser._id) return;
			if (state.selectedChat) {
				if (state.selectedChat.users) {
					state.selectedChat.users = state.selectedChat.users.map((u) =>
						u._id === updatedUser._id ? { ...u, ...updatedUser } : u
					);
				}
				if (
					state.selectedChat.groupAdmin &&
					state.selectedChat.groupAdmin._id === updatedUser._id
				) {
					state.selectedChat.groupAdmin = {
						...state.selectedChat.groupAdmin,
						...updatedUser,
					};
				}
			}
			if (state.chat && state.chat.length > 0) {
				state.chat = state.chat.map((chat) => {
					let updatedUsers = chat.users;
					if (chat.users) {
						updatedUsers = chat.users.map((u) =>
							u._id === updatedUser._id ? { ...u, ...updatedUser } : u
						);
					}
					let updatedAdmin = chat.groupAdmin;
					if (chat.groupAdmin && chat.groupAdmin._id === updatedUser._id) {
						updatedAdmin = { ...chat.groupAdmin, ...updatedUser };
					}
					return {
						...chat,
						users: updatedUsers,
						groupAdmin: updatedAdmin,
					};
				});
			}
		},
	},
});

export const {
	addMyChat,
	addSelectedChat,
	addNewChat,
	deleteSelectedChat,
	addNewMessageRecieved,
	removeNewMessageRecieved,
	updateUserInChats,
} = myChatSlice.actions;
export default myChatSlice.reducer;
