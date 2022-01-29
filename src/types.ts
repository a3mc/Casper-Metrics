export interface RequiredPermissions {
    required?: string;
}

export interface MyUserProfile {
    id: number;
    email?: string;
    permissions: string;
}

