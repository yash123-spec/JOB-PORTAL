import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";



// Google OAuth Strategy - Only initialize if credentials exist
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: "/api/auth/google/callback",

            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user exists with this Google ID
                    let user = await User.findOne({ providerId: profile.id, authProvider: 'google' });

                    if (user) {
                        if (!user.isActive || user.accountStatus === 'blocked') {
                            return done(null, false, { message: "Your account has been deactivated." });
                        }
                        return done(null, user);
                    }

                    // Check if user exists with same email (but different provider)
                    const existingUser = await User.findOne({ email: profile.emails[0].value });

                    if (existingUser) {
                        // Email exists but with different auth provider
                        // For security, don't automatically link accounts
                        return done(null, false, {
                            message: `An account with this email already exists. Please login with ${existingUser.authProvider}.`
                        });
                    }

                    // Create new user (auto-approved candidate)
                    user = await User.create({
                        fullname: profile.displayName,
                        email: profile.emails[0].value,
                        authProvider: 'google',
                        providerId: profile.id,
                        emailVerified: true,
                        role: 'candidate', // OAuth users are always candidates
                        accountStatus: 'approved',
                        profilePic: profile.photos[0]?.value || null
                    });

                    return done(null, user);
                } catch (error) {
                    console.error("Google OAuth Error:", error);
                    return done(error, null);
                }
            }
        )
    );

} else {
    console.log('⚠️  Google OAuth not configured');
}

export default passport;
