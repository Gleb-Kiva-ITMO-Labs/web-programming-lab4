package ru.s408766.shooter.utils.models;

import jakarta.json.Json;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Entity
@Table(name = "users")
@NoArgsConstructor
public class User implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "email", unique = true, nullable = false)
    private String email;
    @Column(name = "password", nullable = false)
    private String password;
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResultInfo> results;

    public User(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public void addResult(ResultInfo result) {
        results.add(result);
        result.setUser(this);
    }

    public String getResultsAsJSON() {
        return Json.createArrayBuilder(
                results.stream()
                        .map(ResultInfo::toJSONObject)
                        .toList()
        ).build().toString();
    }

    public void clearResults() {
        results.clear();
    }
}