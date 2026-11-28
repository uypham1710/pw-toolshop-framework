export interface AddressRequest {
  street: string;
  house_number?: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
}

export interface AddressResponse {
  street: string;
  house_number: string | null;
  city: string;
  state: string | null;
  country: string;
  postal_code: string | null;
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  address: AddressRequest;
  phone?: string;
  /** Format YYYY-MM-DD */
  dob: string;
  password: string;
  email: string;
}

export interface CreateUserResponse extends Omit<
  CreateUserRequest,
  "password" | "address" | "phone"
> {
  id: string;
  address: AddressResponse;
  phone: string | null;
  provider: string | null;
  totp_enabled: boolean;
  enabled: boolean;
  failed_login_attempts: number | null;
  created_at: string;
}
