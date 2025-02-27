package ru.s408766.shooter.resources;

import jakarta.ejb.EJB;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import ru.s408766.shooter.utils.models.ResultInfo;
import ru.s408766.shooter.utils.models.User;
import ru.s408766.shooter.utils.services.ResultService;
import ru.s408766.shooter.utils.services.TokenService;
import org.json.JSONObject;

import java.security.InvalidParameterException;
import java.util.Objects;
import java.util.function.Function;

@Path("/results")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ResultsResource {
    @EJB
    private TokenService tokenService;
    @EJB
    private ResultService resultService;

    private Response validateAuth(String authHeader, User[] userHolder) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity("Token not found")
                    .build();
        }

        String token = authHeader.substring("Bearer ".length());
        User user = tokenService.getUserFromToken(token);

        if (Objects.isNull(user)) {
            return Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity("User not found")
                    .build();
        }

        userHolder[0] = user;
        return null;
    }

    private Response successResponse(Object entity) {
        return Response
                .status(Response.Status.OK)
                .entity(entity)
                .build();
    }

    private Response serverErrorResponse(String message) {
        return Response
                .status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(message)
                .build();
    }

    private Response executeWithAuth(String authHeader, Function<User, Response> operation) {
        User[] userHolder = new User[1];
        Response authError = validateAuth(authHeader, userHolder);

        if (authError != null) {
            return authError;
        }

        try {
            return operation.apply(userHolder[0]);
        } catch (InvalidParameterException e) {
            return Response
                    .status(Response.Status.BAD_REQUEST)
                    .entity("Invalid parameters")
                    .build();
        } catch (Exception e) {
            return serverErrorResponse("Error processing request: " + e.getMessage());
        }
    }

    @POST
    public Response addResult(
            @HeaderParam("Authorization") String authHeader,
            double x, double y, double shapeRadius) {

        return executeWithAuth(authHeader, user -> {
            ResultInfo result = ResultInfo.calculate(x, y, shapeRadius);
            user.addResult(result);

            if (resultService.saveResultToDb(result)) {
                return successResponse(result.toJSONObject());
            } else {
                return serverErrorResponse("Error while saving result");
            }
        });
    }

    @DELETE
    public Response clearResults(@HeaderParam("Authorization") String authHeader) {
        return executeWithAuth(authHeader, user -> {
            resultService.clearResultsForUser(user);
            user.clearResults();
            return successResponse("All results cleared successfully");
        });
    }

    @GET
    public Response getResults(@HeaderParam("Authorization") String authHeader) {
        return executeWithAuth(authHeader, user ->
                successResponse(user.getResultsAsJSON())
        );
    }

    @Path("/userStats")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUserStats(@HeaderParam("Authorization") String authHeader) {
        return executeWithAuth(authHeader, user -> {
            String login = user.getLogin();
            String totalResults = String.valueOf(user.getResults().toArray().length);
            String hits = String.valueOf(user.getResults().stream().filter(ResultInfo::isResult).count());
            String misses = String.valueOf(user.getResults().stream().filter(r -> !r.isResult()).count());

            JSONObject stats = new JSONObject();
            stats.put("login", login);
            stats.put("totalResults", totalResults);
            stats.put("hits", hits);
            stats.put("misses", misses);

            return successResponse(stats.toString());
        });
    }
}