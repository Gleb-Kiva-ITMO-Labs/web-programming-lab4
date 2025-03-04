package ru.s408766.shooter.resources;

import jakarta.ejb.EJB;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.extern.java.Log;
import ru.s408766.shooter.utils.models.User;
import ru.s408766.shooter.utils.services.PasswordUtil;
import ru.s408766.shooter.utils.services.TokenService;
import ru.s408766.shooter.utils.services.UserService;

import javax.security.auth.login.LoginException;
import java.util.ArrayList;

@Log
@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {
    @EJB
    private UserService userService;
    @Inject
    private TokenService tokenService;

    @POST
    @Path("/register")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response register(User user) {
        User registeredUser = new User();
        registeredUser.setLogin(user.getLogin());
        registeredUser.setPassword(PasswordUtil.hashPassword(user.getPassword()));
        registeredUser.setResults(new ArrayList<>());

        if (userService.findByUsername(registeredUser.getLogin()) != null) {
            return Response
                    .status(Response.Status.CONFLICT)
                    .entity("User with login " + registeredUser.getLogin() + " already exists")
                    .build();
        }

        if (userService.saveUserToDb(registeredUser)) {
            String token = tokenService.generateToken(registeredUser.getLogin());
            return Response
                    .status(Response.Status.OK)
                    .entity("{\"token\":\"" + token + "\"}")
                    .build();
        } else {
            return Response
                    .status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error while saving user")
                    .build();
        }
    }

    @POST
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response login(User user) {
        User registeredUser = userService.findByUsername(user.getLogin());
        System.out.println(user.getLogin());
        System.out.println(user.getPassword());

        if (registeredUser == null) {
            System.out.println("!!!! NO USER");
            return Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity("User not found")
                    .build();
        }

        if (!PasswordUtil.verifyPassword(user.getPassword(), registeredUser.getPassword())) {
            System.out.println("!!!! INVALID PASSWORD");
            return Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity("Invalid password")
                    .build();
        }

        String token = tokenService.generateToken(registeredUser.getLogin());
        return Response
                .status(Response.Status.OK)
                .entity("{\"token\":\"" + token + "\", \"login\":\"" + user.getLogin() + "\"}")
                .build();
    }
}