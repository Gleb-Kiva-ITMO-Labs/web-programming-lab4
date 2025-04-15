package ru.s408766.shooter.resources;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.Data;
import ru.s408766.shooter.utils.models.*;
import ru.s408766.shooter.utils.services.db.ResultService;
import ru.s408766.shooter.utils.services.TokenService;
import org.json.JSONObject;

import java.security.InvalidParameterException;
import java.util.Objects;
import java.util.function.Function;

@Path("/results")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ResultsResource {
    @Inject
    private ResultService resultService;
    @Inject
    private TokenService tokenService;

    @Data
    public static class AddResultRequest {
        @NotNull(message = "X Coordinate cannot be null")
        private Float x;
        @NotNull(message = "Y Coordinate cannot be null")
        private Float y;
        @NotNull(message = "Shape radius cannot be null")
        private Float shapeRadius;
    }

    private Response validateAuth(String authHeader, User[] userHolder) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("Token not found")
                    .build();

        String token = authHeader.substring("Bearer ".length());
        User user = tokenService.getUserFromToken(token);
        if (Objects.isNull(user))
            return Response
                    .status(Response.Status.UNAUTHORIZED)
                    .entity("User not found")
                    .build();

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
        if (authError != null) return authError;
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

    @Path("/add-result")
    @POST
    public Response addResult(
            @HeaderParam("Authorization") String authHeader,
            @Valid AddResultRequest addResultRequest) {

        return executeWithAuth(authHeader, user -> {
            try {
                ResultInfo result = ResultInfo.calculate(addResultRequest.getX(), addResultRequest.getY(), addResultRequest.getShapeRadius());
                user.addResult(result);

                if (resultService.saveResultToDb(result)) {
                    return successResponse(result.toJSONObject());
                } else {
                    return serverErrorResponse("Error while saving result");
                }
            } catch (InvalidParameterException e) {
                return Response
                        .status(Response.Status.BAD_REQUEST)
                        .entity(e.getMessage())
                        .build();
            }
        });
    }

    @Path("/clear-results")
    @DELETE
    public Response clearResults(@HeaderParam("Authorization") String authHeader) {
        return executeWithAuth(authHeader, user -> {
            resultService.clearResultsForUser(user);
            user.clearResults();
            JSONObject result = new JSONObject();
            result.put("message", "All results cleared successfully");
            return successResponse(result.toString());
        });
    }

    @Path("/get-results")
    @GET
    public Response getResults(@HeaderParam("Authorization") String authHeader) {
        return executeWithAuth(authHeader, user ->
                successResponse(user.getResultsAsJSON())
        );
    }

    @Path("/user-stats")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUserStats(@HeaderParam("Authorization") String authHeader) {
        return executeWithAuth(authHeader, user -> {
            String email = user.getEmail();
            String totalResults = String.valueOf(user.getResults().toArray().length);
            String hits = String.valueOf(user.getResults().stream().filter(ResultInfo::isResult).count());
            String misses = String.valueOf(user.getResults().stream().filter(r -> !r.isResult()).count());

            JSONObject stats = new JSONObject();
            stats.put("email", email);
            stats.put("totalResults", totalResults);
            stats.put("hits", hits);
            stats.put("misses", misses);

            return successResponse(stats.toString());
        });
    }
}