package ru.s408766.shooter.utils.services.db;

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

    public User findByUsername(String email) {
        String query = "SELECT u FROM User u WHERE u.email = :email";
        TypedQuery<User> typedQuery = em.createQuery(query, User.class);
        typedQuery.setParameter("email", email);
        return typedQuery.getResultStream().findFirst().orElse(null);
    }

    public boolean updateUser(User user) {
        try {
            em.getTransaction().begin();
            em.merge(user);
            em.getTransaction().commit();
            return true;
        } catch (Exception e) {
            em.getTransaction().rollback();
            return false;
        }
    }
}