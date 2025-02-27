package ru.s408766.shooter.utils.models;


import ru.s408766.shooter.utils.ProjectConstants;

import java.security.InvalidParameterException;

public record Point(double x, double y) {
    public Point(double x, double y) {
        this.x = x;
        this.y = y;
        if (Double.isNaN(x) || Double.isNaN(y)) throw new IllegalArgumentException("Some point coordinate is NaN");
        if (!(ProjectConstants.MIN_X <= x && x <= ProjectConstants.MAX_X))
            throw new InvalidParameterException(
                    String.format("X should be between %f and %f",
                            ProjectConstants.MIN_X,
                            ProjectConstants.MAX_X));
        if (!(ProjectConstants.MIN_Y <= y && y <= ProjectConstants.MAX_Y))
            throw new InvalidParameterException(
                    String.format("Y should be between %f and %f",
                            ProjectConstants.MIN_Y,
                            ProjectConstants.MAX_Y));
    }
}