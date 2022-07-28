// Basic types used for user authentication and getting the user profile.
// Only needed for the admin enpoints.

export interface RequiredPermissions {
	required?: string;
}

export interface MyUserProfile {
	id: number;
	email?: string;
	permissions: string;
}

