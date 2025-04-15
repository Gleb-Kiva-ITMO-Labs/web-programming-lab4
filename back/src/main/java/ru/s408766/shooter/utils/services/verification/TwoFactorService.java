package ru.s408766.shooter.utils.services.verification;

import jakarta.ejb.Stateless;
import jakarta.inject.Inject;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Stateless
public class TwoFactorService {
    @Inject
    private EmailService emailService;

    private final Map<String, TwoFactorToken> verificationCodesStorage = new HashMap<>();

    private static class TwoFactorToken {
        String code;
        long creationTime;

        TwoFactorToken(String code, long creationTime) {
            this.code = code;
            this.creationTime = creationTime;
        }
    }

    private String generateVerificationCode() {
        SecureRandom random = new SecureRandom();
        return String.format("%06d", random.nextInt(999999));
    }

    public String generateAndSendCode(String userEmail) {
        String code = generateVerificationCode();
        TwoFactorToken token = new TwoFactorToken(code, System.currentTimeMillis());
        verificationCodesStorage.put(userEmail, token);
        emailService.sendVerificationCode(userEmail, code);
        return code;
    }

    private boolean isTokenExpired(TwoFactorToken token) {
        long currentTime = System.currentTimeMillis();
        return (currentTime - token.creationTime) > TimeUnit.MINUTES.toMillis(15);
    }

    public boolean verifyCode(String userEmail, String inputCode) {
        TwoFactorToken storedToken = verificationCodesStorage.get(userEmail);
        if (storedToken == null ||
                !storedToken.code.equals(inputCode) ||
                isTokenExpired(storedToken)) {
            return false;
        }
        verificationCodesStorage.remove(userEmail);
        return true;
    }
}