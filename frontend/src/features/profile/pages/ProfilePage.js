// Profile dispatcher — picks the right layout for the signed-in role.
//
// Students see a personal-progress focused view (typing stats + assessment
// history). Teachers see an oversight view (class roster + class averages +
// quick teacher actions). Admins reuse the teacher layout for now; if/when an
// admin-specific layout is needed it slots in here.

import React from "react";
import { useMemo } from "react";
import { getAuthToken } from "../../../shared/auth/AuthUtils";
import { getUserRole } from "../../../shared/auth/JwtUtils";
import StudentProfile from "./StudentProfile";
import TeacherProfile from "./TeacherProfile";

export default function ProfilePage() {
    const role = useMemo(() => {
        const token = getAuthToken();
        if (!token) return null;
        try { return getUserRole(token); } catch { return null; }
    }, []);

    if (role === "TEACHER" || role === "ADMIN") return <TeacherProfile />;
    return <StudentProfile />;
}
