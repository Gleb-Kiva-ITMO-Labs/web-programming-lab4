package ru.s408766.shooter.resources;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.json.JSONObject;
import ru.s408766.shooter.utils.models.User;
import ru.s408766.shooter.utils.PasswordUtil;
import ru.s408766.shooter.utils.services.TokenService;
import ru.s408766.shooter.utils.services.verification.TwoFactorService;
import ru.s408766.shooter.utils.services.db.UserService;

import java.util.ArrayList;

@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {
    @Inject
    private UserService userService;
    @Inject
    private TokenService tokenService;
    @Inject
    private TwoFactorService twoFactorService;


    @Data
    public static class EmailRequest {
        @NotBlank(message = "Email cannot be blank")
        @Email(message = "Badly formatted email")
        @Size(min = 4, max = 36, message = "Email must be between 4 and 36 characters")
        private String email;
    }

    @EqualsAndHashCode(callSuper = true)
    @Data
    public static class AuthRequest extends EmailRequest {
        @NotBlank(message = "Password cannot be blank")
        @Size(min = 8, max = 36, message = "Password must be between 8 and 36 characters")
        private String password;

    }

    @EqualsAndHashCode(callSuper = true)
    @Data
    public static class AuthVerifiedRequest extends AuthRequest {
        @NotBlank(message = "Verification code cannot be blank")
        @Size(min = 6, max = 6, message = "Verification code must be 6 digits")
        private String verificationCode;
    }

    // логин? нет > регистрация? да > код? правильный > регистрация > логин
    @POST
    @Path("/signup")
    public Response signUp(@Valid AuthVerifiedRequest authRequest) {
        if (userService.findByUsername(authRequest.getEmail()) != null) {
            return Response
                    .status(Response.Status.CONFLICT)
                    .entity("User with email " + authRequest.getEmail() + " already exists")
                    .build();
        }
        // пользователя не существует > проверим код
        boolean isCodeValid = twoFactorService.verifyCode(
                authRequest.getEmail(),
                authRequest.getVerificationCode());
        if (!isCodeValid) {
            return Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity("Invalid verification code")
                    .build();
        }
        // код правильный > делаем нового
        User newUser = new User();
        newUser.setEmail(authRequest.getEmail());
        newUser.setPassword(PasswordUtil.hashPassword(authRequest.getPassword()));
        newUser.setResults(new ArrayList<>());
        if (!userService.saveUserToDb(newUser)) {
            return Response
                    .status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error while creating user")
                    .build();
        }
        // пользователь готов, вернём токен
        String token = tokenService.generateToken(newUser.getEmail());
        return Response
                .status(Response.Status.OK)
                .entity("{\"token\":\"" + token + "\"}")
                .build();
    }

    @POST
    @Path("/request-2fa")
    public Response requestTwoFactorCode(
            @Valid EmailRequest codeRequest) {
        String code = twoFactorService.generateAndSendCode(codeRequest.getEmail());
        return Response
                .status(Response.Status.OK)
                .entity("{\"message\": \"Verification code sent\"}")
                .build();
    }

    @POST
    @Path("/signin")
    public Response signIn(@Valid AuthRequest authRequest) {
        User existingUser = userService.findByUsername(authRequest.getEmail());
        if (existingUser == null) {
            return Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity("User not found")
                    .build();
        }
        if (!PasswordUtil.verifyPassword(authRequest.getPassword(), existingUser.getPassword())) {
            return Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity("Invalid password")
                    .build();
        }
        String token = tokenService.generateToken(existingUser.getEmail());
        return Response
                .status(Response.Status.OK)
                .entity("{\"token\":\"" + token + "\", \"email\":\"" + existingUser.getEmail() + "\"}")
                .build();
    }

    @POST
    @Path("/request-password-reset")
    public Response requestPasswordReset(@Valid EmailRequest resetRequest) {
        User existingUser = userService.findByUsername(resetRequest.getEmail());
        if (existingUser == null) {
            return Response
                    .status(Response.Status.NOT_FOUND)
                    .entity("User not found")
                    .build();
        }
        twoFactorService.generateAndSendCode(resetRequest.getEmail());
        return Response
                .status(Response.Status.OK)
                .entity("{\"message\": \"Password reset verification code sent\"}")
                .build();
    }

    @POST
    @Path("/reset-password")
    public Response resetPassword(@Valid AuthVerifiedRequest resetRequest) {
        User existingUser = userService.findByUsername(resetRequest.getEmail());
        if (existingUser == null) {
            return Response
                    .status(Response.Status.NOT_FOUND)
                    .entity("User not found")
                    .build();
        }
        // пользователь существует, чекаем код
        boolean isCodeValid = twoFactorService.verifyCode(
                resetRequest.getEmail(),
                resetRequest.getVerificationCode());
        if (!isCodeValid) {
            return Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity("Invalid verification code")
                    .build();
        }
        // всё ок, апдейтим
        existingUser.setPassword(PasswordUtil.hashPassword(resetRequest.getPassword()));
        if (!userService.updateUser(existingUser)) {
            return Response
                    .status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error while updating password")
                    .build();
        }
        String token = tokenService.generateToken(existingUser.getEmail());
        return Response
                .status(Response.Status.OK)
                .entity("{\"message\": \"Password reset successful\", \"token\":\"" + token + "\", \"email\":\"" + existingUser.getEmail() + "\"}")
                .build();
    }
}