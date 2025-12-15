import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import { User } from "../models/user.model.js";

// Serialize user for session (not used with JWT, but required by Passport)
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy - Only initialize if credentials exist
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: "/api/auth/google/callback",
                scope: ["profile", "email"]
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user exists with this Google ID
                    let user = await User.findOne({ providerId: profile.id, authProvider: 'google' });

                    if (user) {
                        // User exists, return user
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
    console.log('✅ Google OAuth strategy initialized');
} else {
    console.log('⚠️  Google OAuth not configured');
}

// Apple OAuth Strategy - Only initialize if credentials exist
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID) {
    passport.use(
        new AppleStrategy(
            {
                clientID: process.env.APPLE_CLIENT_ID,
                teamID: process.env.APPLE_TEAM_ID,
                keyID: process.env.APPLE_KEY_ID,
                privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
                callbackURL: "/api/auth/apple/callback",
                scope: ["name", "email"],
                passReqToCallback: true
            },
            async (req, accessToken, refreshToken, idToken, profile, done) => {
                try {
                    // Apple doesn't always provide profile data after first login
                    // Use idToken for user info
                    const appleId = profile.id;
                    const email = profile.email;
                    const name = profile.name ? `${profile.name.firstName || ''} ${profile.name.lastName || ''}`.trim() : email.split('@')[0];

                    // Check if user exists with this Apple ID
                    let user = await User.findOne({ providerId: appleId, authProvider: 'apple' });

                    if (user) {
                        return done(null, user);
                    }

                    // Check if user exists with same email
                    const existingUser = await User.findOne({ email });

                    if (existingUser) {
                        return done(null, false, {
                            message: `An account with this email already exists. Please login with ${existingUser.authProvider}.`
                        });
                    }

                    // Create new user
                    user = await User.create({
                        fullname: name,
                        email,
                        authProvider: 'apple',
                        providerId: appleId,
                        emailVerified: true,
                        role: 'candidate',
                        accountStatus: 'approved'
                    });

                    return done(null, user);
                } catch (error) {
                    console.error("Apple OAuth Error:", error);
                    return done(error, null);
                }
            }
        )
    );
    console.log('✅ Apple OAuth strategy initialized');
} else {
    console.log('⚠️  Apple OAuth not configured');
}

export default passport;
