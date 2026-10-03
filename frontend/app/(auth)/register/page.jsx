// // ─────────────────────────────────────────────────────────────────────────────
// // FILE: smartmenuai/frontend/app/(auth)/register/page.jsx
// // (MUI version – matches the login page styling exactly)
// // ─────────────────────────────────────────────────────────────────────────────
// "use client";
// import { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/lib/auth-context";
// import {
//     Box, Typography, TextField, Button, InputAdornment,
//     IconButton, Link as MuiLink, alpha,
// } from "@mui/material";
// import { Visibility, VisibilityOff, ErrorOutlineOutlined } from "@mui/icons-material";
// import { motion } from "framer-motion";

// const BRAND = "#D4850A";
// const BRAND_DARK = "#A0622A";
// const GOLD = "#F5C842";
// const TEXT_P = "#F9EDD8";
// const TEXT_S = "#D4A872";
// const TEXT_M = "#8B6038";
// const TEXT_D = "#5F3E22";
// const ERROR = "#ef4444";

// const inputSx = {
//     "& .MuiOutlinedInput-root": {
//         borderRadius: "14px",
//         background: "rgba(45,18,0,0.8)",
//         color: TEXT_P,
//         fontSize: 14,
//         "& fieldset": { borderColor: "rgba(212,133,10,0.18)" },
//         "&:hover fieldset": { borderColor: alpha(BRAND, 0.45) },
//         "&.Mui-focused fieldset": {
//             borderColor: BRAND,
//             boxShadow: `0 0 0 3px ${alpha(BRAND, 0.18)}, 0 0 20px ${alpha(BRAND, 0.12)}`,
//         },
//     },
//     "& .MuiInputLabel-root": { color: TEXT_M, fontSize: 14 },
//     "& .MuiInputLabel-root.Mui-focused": { color: BRAND },
// };

// export default function RegisterPage() {
//     const { register, loading } = useAuth();
//     const router = useRouter();
//     const [form, setForm] = useState({
//         fullName: "",
//         email: "",
//         password: "",
//         confirmPassword: "",
//     });
//     const [error, setError] = useState("");
//     const [showPass, setShowPass] = useState(false);

//     const passwordStrength = (() => {
//         const p = form.password;
//         if (!p) return 0;
//         let score = 0;
//         if (p.length >= 8) score++;
//         if (/[A-Z]/.test(p)) score++;
//         if (/[0-9]/.test(p)) score++;
//         if (/[^A-Za-z0-9]/.test(p)) score++;
//         return score;
//     })();

//     const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
//     const strengthColor = ["", ERROR, BRAND, GOLD, "#22c55e"][passwordStrength];

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError("");
//         if (form.password !== form.confirmPassword) {
//             setError("Passwords don't match.");
//             return;
//         }
//         if (form.password.length < 8) {
//             setError("Password must be at least 8 characters.");
//             return;
//         }
//         try {
//             await register({
//                 username: form.email.split("@")[0],
//                 email: form.email,
//                 password: form.password,
//                 fullName: form.fullName,
//                 accountType: "business_owner",
//             });
//             router.replace("/onboarding");
//         } catch (err) {
//             setError(err.message || "Registration failed. Please try again.");
//         }
//     };

//     return (
//         <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
//         >
//             <Box sx={{ mb: 4 }}>
//                 <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: TEXT_P, mb: 0.75, fontSize: { xs: 28, sm: 34 } }}>
//                     Create account
//                 </Typography>
//                 <Typography sx={{ fontSize: 14, color: TEXT_M }}>
//                     Start managing your venue smarter
//                 </Typography>
//             </Box>

//             {error && (
//                 <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.75, borderRadius: "14px", mb: 3, background: alpha(ERROR, 0.09), border: `1px solid ${alpha(ERROR, 0.28)}` }}>
//                         <ErrorOutlineOutlined sx={{ color: "#f87171", fontSize: 18, flexShrink: 0 }} />
//                         <Typography sx={{ fontSize: 13, color: "#f87171" }}>{error}</Typography>
//                     </Box>
//                 </motion.div>
//             )}

//             <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
//                 <TextField label="Full name" type="text" placeholder="John Banda" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required fullWidth sx={inputSx} InputLabelProps={{ shrink: !!form.fullName || undefined }} />
//                 <TextField label="Email address" type="email" placeholder="you@restaurant.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required fullWidth sx={inputSx} InputLabelProps={{ shrink: !!form.email || undefined }} />

//                 {/* Password */}
//                 <Box>
//                     <Typography sx={{ fontSize: 13, color: TEXT_M, fontWeight: 500, mb: 0.5 }}>Password</Typography>
//                     <TextField
//                         type={showPass ? "text" : "password"}
//                         placeholder="Min. 8 characters"
//                         value={form.password}
//                         onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
//                         required
//                         fullWidth
//                         sx={inputSx}
//                         InputProps={{
//                             endAdornment: (
//                                 <InputAdornment position="end">
//                                     <IconButton onClick={() => setShowPass((v) => !v)} edge="end" size="small" sx={{ color: TEXT_M, "&:hover": { color: TEXT_S } }}>
//                                         {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
//                                     </IconButton>
//                                 </InputAdornment>
//                             ),
//                         }}
//                     />
//                     {form.password && (
//                         <Box sx={{ mt: 1.5 }}>
//                             <Box sx={{ display: "flex", gap: "4px", mb: 0.5 }}>
//                                 {[1, 2, 3, 4].map((i) => (
//                                     <Box key={i} sx={{ flex: 1, height: 4, borderRadius: 4, background: i <= passwordStrength ? strengthColor : "rgba(45,18,0,0.8)", transition: "background 0.3s" }} />
//                                 ))}
//                             </Box>
//                             <Typography sx={{ fontSize: 12, color: strengthColor }}>{strengthLabel}</Typography>
//                         </Box>
//                     )}
//                 </Box>

//                 {/* Confirm password */}
//                 <TextField
//                     type={showPass ? "text" : "password"}
//                     label="Confirm password"
//                     placeholder="Repeat password"
//                     value={form.confirmPassword}
//                     onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
//                     required
//                     fullWidth
//                     sx={inputSx}
//                 />
//                 {form.confirmPassword && form.password !== form.confirmPassword && (
//                     <Typography sx={{ fontSize: 12, color: ERROR, mt: -1 }}>Passwords don't match</Typography>
//                 )}

//                 <motion.div whileTap={{ scale: 0.98 }}>
//                     <Button
//                         type="submit"
//                         fullWidth
//                         disabled={loading || !form.fullName || !form.email || !form.password}
//                         sx={{
//                             height: 52, mt: 0.5, borderRadius: "14px",
//                             background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
//                             color: "#FFF8ED", fontSize: 15, fontWeight: 700,
//                             boxShadow: `0 4px 24px ${alpha(BRAND, 0.38)}, inset 0 1px 0 rgba(255,255,255,0.18)`,
//                             border: `1px solid ${alpha(BRAND, 0.45)}`,
//                             "&:hover": {
//                                 background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
//                                 boxShadow: `0 8px 36px ${alpha(BRAND, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
//                                 transform: "translateY(-2px)",
//                             },
//                             "&.Mui-disabled": { opacity: 0.5, transform: "none" },
//                         }}
//                     >
//                         {loading ? (
//                             <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//                                 <Box sx={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.25)", borderTopColor: "white", animation: "spinArc 0.75s linear infinite" }} />
//                                 Creating account…
//                             </Box>
//                         ) : "Create account →"}
//                     </Button>
//                 </motion.div>
//             </Box>

//             {/* Divider */}
//             <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 3.5 }}>
//                 <Box sx={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(BRAND, 0.22)}, transparent)` }} />
//                 <Typography sx={{ fontSize: 12, color: TEXT_D }}>or</Typography>
//                 <Box sx={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(BRAND, 0.22)}, transparent)` }} />
//             </Box>

//             <Typography sx={{ textAlign: "center", fontSize: 14, color: TEXT_M }}>
//                 Already have an account?{" "}
//                 <MuiLink component={Link} href="/login" sx={{ color: BRAND, fontWeight: 700, textDecoration: "none", "&:hover": { color: GOLD } }}>
//                     Sign in
//                 </MuiLink>
//             </Typography>

//             <Typography sx={{ textAlign: "center", fontSize: 12, color: TEXT_D, mt: 2 }}>
//                 Platform admin?{" "}
//                 <MuiLink component={Link} href="/setup-platform-master" sx={{ color: "#6B3318", textDecoration: "none", "&:hover": { color: TEXT_M } }}>
//                     Set up master account
//                 </MuiLink>
//             </Typography>
//         </motion.div>
//     );
// }
// app/(auth)/register/page.jsx
"use client";
import { useState } from "react";
import {
    Box, Typography, TextField, Button, InputAdornment,
    IconButton, Divider, Link as MuiLink,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Visibility, VisibilityOff, ErrorOutlineOutlined } from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const BRAND = "#D4850A";
const GOLD = "#F5C842";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";

const sx = {
    input: {
        "& .MuiOutlinedInput-root": {
            borderRadius: "14px",
            background: "rgba(45,18,0,0.8)",
            color: TEXT_P,
            fontSize: 14,
            transition: "all 220ms",
            "& fieldset": {
                borderColor: "rgba(212,133,10,0.18)",
                transition: "all 220ms",
            },
            "&:hover fieldset": { borderColor: alpha(BRAND, 0.45) },
            "&.Mui-focused fieldset": {
                borderColor: BRAND,
                boxShadow: `0 0 0 3px ${alpha(BRAND, 0.18)}, 0 0 20px ${alpha(BRAND, 0.12)}`,
            },
        },
        "& .MuiInputLabel-root": { color: TEXT_M, fontSize: 14 },
        "& .MuiInputLabel-root.Mui-focused": { color: BRAND },
        "& input": { color: TEXT_P },
    },
};

export default function RegisterPage() {
    const { register, loading } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [showPass, setShowPass] = useState(false);

    // Password strength evaluation
    const passwordStrength = (() => {
        const p = form.password;
        if (!p) return 0;
        let score = 0;
        if (p.length >= 8) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        return score;
    })();

    const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
    const strengthColor = ["", "#ef4444", "#D4850A", "#D4A017", "#22c55e"][passwordStrength];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords don't match.");
            return;
        }
        if (form.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        try {
            const email = form.email.trim().toLowerCase();
            await register({
                username: email,
                email,
                password: form.password,
                fullName: form.fullName,
                accountType: "business_owner",
            });
            router.replace("/onboarding");
        } catch (err) {
            setError(err.message || "Registration failed. Please try again.");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            style={{ width: "100%", maxWidth: 460 }}
        >
            {/* Heading */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 700,
                        color: TEXT_P,
                        mb: 0.75,
                        fontSize: { xs: 28, sm: 34 },
                    }}
                >
                    Create account
                </Typography>
                <Typography sx={{ fontSize: 14, color: TEXT_M }}>
                    Start managing your venue smarter
                </Typography>
            </Box>

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2.5,
                            py: 1.75,
                            borderRadius: "14px",
                            mb: 3,
                            background: alpha("#ef4444", 0.09),
                            border: `1px solid ${alpha("#ef4444", 0.28)}`,
                        }}
                    >
                        <ErrorOutlineOutlined sx={{ color: "#f87171", fontSize: 18, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 13, color: "#f87171" }}>{error}</Typography>
                    </Box>
                </motion.div>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Full Name */}
                <TextField
                    label="Full name"
                    type="text"
                    placeholder="John Banda"
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    required
                    autoFocus
                    fullWidth
                    sx={sx.input}
                    InputLabelProps={{ shrink: !!form.fullName || undefined }}
                />

                {/* Email */}
                <TextField
                    label="Email address"
                    type="email"
                    placeholder="you@restaurant.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    fullWidth
                    sx={sx.input}
                    InputLabelProps={{ shrink: !!form.email || undefined }}
                />

                {/* Password */}
                <Box>
                    <Typography sx={{ fontSize: 13, color: TEXT_M, fontWeight: 500, mb: 0.5 }}>
                        Password
                    </Typography>
                    <TextField
                        type={showPass ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        required
                        fullWidth
                        sx={sx.input}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPass((v) => !v)}
                                        edge="end"
                                        size="small"
                                        sx={{ color: TEXT_M, "&:hover": { color: TEXT_S } }}
                                    >
                                        {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    {/* Strength bar */}
                    {form.password && (
                        <Box sx={{ mt: 1.5 }}>
                            <Box sx={{ display: "flex", gap: "4px", mb: 0.5 }}>
                                {[1, 2, 3, 4].map((i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            flex: 1,
                                            height: 4,
                                            borderRadius: 4,
                                            background:
                                                i <= passwordStrength ? strengthColor : "rgba(45,18,0,0.8)",
                                            transition: "background 0.3s",
                                        }}
                                    />
                                ))}
                            </Box>
                            <Typography sx={{ fontSize: 12, color: strengthColor }}>
                                {strengthLabel}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Confirm Password */}
                <Box>
                    <Typography sx={{ fontSize: 13, color: TEXT_M, fontWeight: 500, mb: 0.5 }}>
                        Confirm password
                    </Typography>
                    <TextField
                        type={showPass ? "text" : "password"}
                        placeholder="Repeat password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                        required
                        fullWidth
                        sx={sx.input}
                    />
                    {form.confirmPassword && form.password !== form.confirmPassword && (
                        <Typography sx={{ fontSize: 12, color: "#ef4444", mt: 0.5 }}>
                            Passwords don&apos;t match
                        </Typography>
                    )}
                </Box>

                <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                        type="submit"
                        fullWidth
                        disabled={loading || !form.fullName || !form.email || !form.password}
                        sx={{
                            height: 52,
                            mt: 0.5,
                            borderRadius: "14px",
                            background: `linear-gradient(135deg, ${BRAND} 0%, #A0622A 100%)`,
                            color: "#FFF8ED",
                            fontSize: 15,
                            fontWeight: 700,
                            boxShadow: `0 4px 24px ${alpha(BRAND, 0.38)}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                            border: `1px solid ${alpha(BRAND, 0.45)}`,
                            letterSpacing: "0.01em",
                            transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
                            "&:hover": {
                                background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                                boxShadow: `0 8px 36px ${alpha(BRAND, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                                transform: "translateY(-2px)",
                            },
                            "&:active": { transform: "translateY(0)" },
                            "&.Mui-disabled": { opacity: 0.5, transform: "none" },
                        }}
                    >
                        {loading ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: "50%",
                                        border: "2.5px solid rgba(255,255,255,0.25)",
                                        borderTopColor: "white",
                                        animation: "spinArc 0.75s linear infinite",
                                    }}
                                />
                                Creating account…
                            </Box>
                        ) : (
                            "Create account →"
                        )}
                    </Button>
                </motion.div>
            </Box>

            {/* Divider */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 3.5 }}>
                <Box
                    sx={{
                        flex: 1,
                        height: 1,
                        background: `linear-gradient(90deg, transparent, ${alpha(BRAND, 0.22)}, transparent)`,
                    }}
                />
                <Typography sx={{ fontSize: 12, color: TEXT_D }}>or</Typography>
                <Box
                    sx={{
                        flex: 1,
                        height: 1,
                        background: `linear-gradient(90deg, transparent, ${alpha(BRAND, 0.22)}, transparent)`,
                    }}
                />
            </Box>

            {/* Bottom links */}
            <Typography sx={{ textAlign: "center", fontSize: 14, color: TEXT_M }}>
                Already have an account?{" "}
                <MuiLink
                    component={Link}
                    href="/login"
                    sx={{
                        color: BRAND,
                        fontWeight: 700,
                        textDecoration: "none",
                        "&:hover": { color: GOLD },
                    }}
                >
                    Sign in
                </MuiLink>
            </Typography>

            <Typography sx={{ textAlign: "center", fontSize: 12, color: TEXT_D, mt: 2 }}>
                Platform admin?{" "}
                <MuiLink
                    component={Link}
                    href="/setup-platform-master"
                    sx={{
                        color: "#6B3318",
                        textDecoration: "none",
                        "&:hover": { color: TEXT_M },
                    }}
                >
                    Set up master account
                </MuiLink>
            </Typography>
        </motion.div>
    );
}