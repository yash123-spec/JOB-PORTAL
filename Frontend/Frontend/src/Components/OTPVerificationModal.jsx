import React, { useState, useRef, useEffect } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const OTPVerificationModal = ({ isOpen, onClose, email, registrationData, onSuccess }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const inputRefs = useRef([]);

    const API_BASE = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL || 'http://localhost:8000';

    useEffect(() => {
        if (isOpen && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen, timeLeft]);

    useEffect(() => {
        if (isOpen && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [isOpen]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleChange = (index, value) => {
        if (value.length > 1) {
            value = value[0];
        }

        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
        setOtp(newOtp);

        const lastFilledIndex = Math.min(pastedData.length - 1, 5);
        inputRefs.current[lastFilledIndex]?.focus();
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            toast.error('Please enter complete OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${API_BASE}/api/auth/recruiter/verify-otp`,
                {
                    email,
                    otp: otpString,
                    ...registrationData
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message);
                onSuccess();
                onClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            const response = await axios.post(
                `${API_BASE}/api/auth/recruiter/resend-otp`,
                { email },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('New OTP sent to your email');
                setTimeLeft(600);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                    <p className="text-gray-600">
                        We've sent a 6-digit code to<br />
                        <span className="font-medium text-gray-900">{email}</span>
                    </p>
                </div>

                <div className="mb-6">
                    <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        ))}
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                            Time remaining: <span className="font-medium text-gray-900">{formatTime(timeLeft)}</span>
                        </p>
                        {timeLeft === 0 && (
                            <p className="text-sm text-red-600 font-medium">OTP expired. Please request a new one.</p>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleVerify}
                    disabled={loading || otp.join('').length !== 6 || timeLeft === 0}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mb-4"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Verifying...
                        </>
                    ) : (
                        'Verify OTP'
                    )}
                </button>

                <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                    <button
                        onClick={handleResend}
                        disabled={resending || timeLeft > 540}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        {resending ? 'Sending...' : timeLeft > 540 ? `Resend in ${60 - Math.floor((600 - timeLeft) / 10)}s` : 'Resend OTP'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OTPVerificationModal;
