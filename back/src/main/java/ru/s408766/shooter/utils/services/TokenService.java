package ru.s408766.shooter.utils.services;

import java.security.Key;
import java.util.Date;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import jakarta.ejb.EJB;
import ru.s408766.shooter.utils.models.User;

public class TokenService {
    private static final String SECRET_KEY = "10E2064C6F3A262992CBAF0F297C0255973CF6320DE16421BE7965A10F3C376A";
    private static final long EXPIRATION_TIME = 86400000;
    @EJB
    private UserService userService;

    public String generateToken(String login) {
        return Jwts.builder()
                .setSubject(login)
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SignatureAlgorithm.HS512, SECRET_KEY)
                .compact();
    }

    public User getUserFromToken(String token) {
        String login = validateToken(token);
        if (login == null) return null;
        return userService.findByUsername(login);
    }

    public String validateToken(String token) {
        try {
            return Jwts.parser()
                    .setSigningKey(SECRET_KEY)
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception e) {
            return null;
        }
    }
}