import React from 'react';
import { useSelector } from 'react-redux';
import { getUserCookie } from '../../utils/cookies.js';
import RequireAuthModal from './RequireAuthModal.jsx';

/**
 * DiscordAuthGate - Wraps Discord links with authentication check
 * 
 * @param {string} discordUrl - The Discord invite URL
 * @param {string} className - CSS classes for the button
 * @param {React.ReactNode} children - Button content
 */
function DiscordAuthGate({ discordUrl, className, children }) {
    const [authModalOpen, setAuthModalOpen] = React.useState(false);
    const reduxUser = useSelector((state) => state.auth.user);
    const user = reduxUser || getUserCookie();

    const handleClick = () => {
        if (!user) {
            // User not logged in - show auth modal
            setAuthModalOpen(true);
        } else {
            // User logged in - open Discord in new tab
            window.open(discordUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                className={className}
            >
                {children}
            </button>

            <RequireAuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                onConfirm={() => {
                    // Redirect to login with return URL to current page
                    const currentPath = window.location.pathname;
                    window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
                }}
            />
        </>
    );
}

export default DiscordAuthGate;
