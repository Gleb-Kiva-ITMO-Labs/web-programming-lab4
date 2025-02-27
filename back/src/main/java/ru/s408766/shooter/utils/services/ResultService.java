package ru.s408766.shooter.utils.services;

import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Persistence;
import ru.s408766.shooter.utils.models.ResultInfo;
import ru.s408766.shooter.utils.models.User;

@Stateless
public class ResultService {
    private static final EntityManager em = Persistence.createEntityManagerFactory("default").createEntityManager();

    public boolean saveResultToDb(ResultInfo result) {
        try {
            em.getTransaction().begin();
            em.persist(result);
            em.getTransaction().commit();
            return true;
        } catch (Exception e) {
            em.getTransaction().rollback();
            return false;
        }
    }

    public void clearResultsForUser(User user) {
        em.getTransaction().begin();
        em.createQuery("DELETE FROM Result r WHERE r.user = :user")
                .setParameter("user", user)
                .executeUpdate();
        em.getTransaction().commit();
    }
}