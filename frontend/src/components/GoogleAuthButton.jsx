import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";
import { LuLoader } from "react-icons/lu";
import { addAuth } from "../redux/slices/authSlice";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const GoogleAuthButton = ({ disabled = false, onAuthStart, onAuthEnd }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
	const isConfigured = Boolean(
		googleClientId &&
			googleClientId !== "YOUR_GOOGLE_CLIENT_ID" &&
			!googleClientId.startsWith("GOCSPX-")
	);

	const [isLoading, setIsLoading] = useState(false);
	const [scriptError, setScriptError] = useState(false);

	const wrapperRef = useRef(null);
	const buttonContainerRef = useRef(null);
	const isSubmittingRef = useRef(false);
	const disabledRef = useRef(disabled);
	const onAuthStartRef = useRef(onAuthStart);
	const onAuthEndRef = useRef(onAuthEnd);
	const handleCredentialRef = useRef(null);

	useEffect(() => {
		disabledRef.current = disabled;
	}, [disabled]);

	useEffect(() => {
		onAuthStartRef.current = onAuthStart;
		onAuthEndRef.current = onAuthEnd;
	}, [onAuthStart, onAuthEnd]);

	useEffect(() => {
		handleCredentialRef.current = async (response) => {
			if (isSubmittingRef.current || disabledRef.current) return;

			const credential = response?.credential;
			if (!credential) {
				toast.error("Google Sign-In did not return a valid credential.");
				return;
			}

			isSubmittingRef.current = true;
			setIsLoading(true);
			onAuthStartRef.current?.();
			const loadingToastId = toast.loading("Signing in with Google...");

			try {
				const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(
					/\/$/,
					""
				);
				const res = await fetch(`${backendUrl}/api/auth/google`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ credential }),
					}
				);

				const json = await res.json();
				toast.dismiss(loadingToastId);

				if (res.ok && json.token && json.data) {
					localStorage.setItem("token", json.token);
					dispatch(addAuth(json.data));
					navigate("/");
					toast.success(
						json?.message || "Signed in with Google successfully"
					);
				} else {
					toast.error(json?.message || "Google authentication failed");
				}
			} catch (error) {
				console.error("Google Sign-In error:", error);
				toast.dismiss(loadingToastId);
				toast.error("Unable to connect to server for Google Sign-In");
			} finally {
				isSubmittingRef.current = false;
				setIsLoading(false);
				onAuthEndRef.current?.();
			}
		};
	}, [dispatch, navigate]);

	useEffect(() => {
		if (!isConfigured) return;

		let isMounted = true;
		let pollInterval = null;
		let timeoutId = null;

		const renderGoogleButton = () => {
			if (!isMounted || !window.google?.accounts?.id || !buttonContainerRef.current) {
				return false;
			}

			window.google.accounts.id.initialize({
				client_id: googleClientId,
				callback: (response) => handleCredentialRef.current?.(response),
				ux_mode: "popup",
				auto_select: false,
				cancel_on_tap_outside: true,
			});

			buttonContainerRef.current.innerHTML = "";
			const containerWidth = wrapperRef.current?.offsetWidth || 360;
			const buttonWidth = Math.max(
				220,
				Math.min(Math.floor(containerWidth), 400)
			);

			window.google.accounts.id.renderButton(buttonContainerRef.current, {
				type: "standard",
				theme: "outline",
				size: "large",
				shape: "pill",
				text: "continue_with",
				logo_alignment: "center",
				width: buttonWidth,
			});

			return true;
		};

		if (!renderGoogleButton()) {
			// Ensure GIS script exists in DOM
			let existingScript = document.querySelector(
				`script[src="${GOOGLE_SCRIPT_SRC}"]`
			);
			if (!existingScript) {
				existingScript = document.createElement("script");
				existingScript.src = GOOGLE_SCRIPT_SRC;
				existingScript.async = true;
				existingScript.defer = true;
				document.head.appendChild(existingScript);
			}

			pollInterval = setInterval(() => {
				if (renderGoogleButton()) {
					clearInterval(pollInterval);
					clearTimeout(timeoutId);
				}
			}, 150);

			timeoutId = setTimeout(() => {
				clearInterval(pollInterval);
				if (isMounted && !window.google?.accounts?.id) {
					setScriptError(true);
				}
			}, 10000);
		}

		return () => {
			isMounted = false;
			if (pollInterval) clearInterval(pollInterval);
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [googleClientId, isConfigured]);

	if (!isConfigured) {
		return (
			<button
				type="button"
				onClick={() =>
					toast.error(
						"Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in your environment."
					)
				}
				className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-[#E5EAF3] bg-white px-6 py-3.5 text-sm font-semibold text-[#172033] shadow-sm transition-all hover:border-[#BFDBFE] hover:bg-[#F8FAFF]"
			>
				<FcGoogle size={22} />
				<span>Continue with Google</span>
			</button>
		);
	}

	if (scriptError) {
		return (
			<button
				type="button"
				onClick={() =>
					toast.error(
						"Failed to load Google Sign-In script. Please check your network or disable script blockers."
					)
				}
				className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-[#E5EAF3] bg-white px-6 py-3.5 text-sm font-semibold text-[#475569] shadow-sm transition-all hover:bg-[#F8FAFF]"
			>
				<FcGoogle size={22} />
				<span>Continue with Google (Unavailable)</span>
			</button>
		);
	}

	return (
		<div ref={wrapperRef} className="relative flex w-full justify-center">
			<div
				ref={buttonContainerRef}
				className={`flex min-h-[44px] w-full items-center justify-center transition-opacity ${
					isLoading || disabled ? "pointer-events-none opacity-50" : ""
				}`}
			/>
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center rounded-full border border-[#D7E3FF] bg-[#F8FAFF]/95 text-sm font-semibold text-[#2563EB]">
					<LuLoader className="mr-2 animate-spin" size={18} />
					<span>Signing in with Google...</span>
				</div>
			)}
		</div>
	);
};

export default GoogleAuthButton;
