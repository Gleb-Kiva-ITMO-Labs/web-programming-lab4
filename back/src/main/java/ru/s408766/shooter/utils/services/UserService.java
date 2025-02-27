package ru.s408766.shooter.utils.services;

import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Persistence;
import jakarta.persistence.TypedQuery;
import ru.s408766.shooter.utils.models.User;

@Stateless
public class UserService {

    private static final EntityManager em = Persistence.createEntityManagerFactory("default").createEntityManager();

    public boolean saveUserToDb(User user) {
        try {
            em.getTransaction().begin();
            em.persist(user);
            em.getTransaction().commit();
            return true;
        } catch (Exception e) {
            em.getTransaction().rollback();
            return false;
        }
    }

    public User findByUsername(String login) {
        String query = "SELECT u FROM User u WHERE u.login = :login";
        TypedQuery<User> typedQuery = em.createQuery(query, User.class);
        typedQuery.setParameter("login", login);
        return typedQuery.getResultStream().findFirst().orElse(null);
    }

}