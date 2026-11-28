import { test as apiTest } from "./api.fixture";
import type { RegisterForm } from "../data/types";
import { config } from "../config/env";
import { createUser, toCreateUserRequest } from "../data/user.factory";

type NewUser = RegisterForm & { id: string };

type DataFixtures = {
    newUser: NewUser;
};

export const test = apiTest.extend<DataFixtures>({
    newUser: async ({ usersClient, authClient }, use) => {
        const form = createUser();
        const createdUserResponse = await usersClient.register(toCreateUserRequest(form));
        const newUser: NewUser = { ...form, id: createdUserResponse.id };
        await use(newUser);
        const { access_token } = await authClient.login({
            email: config.admin.email,
            password: config.admin.password,
        });
        await usersClient.deleteUser(newUser.id, access_token);
    },
});