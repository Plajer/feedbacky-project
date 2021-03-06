package net.feedbacky.app.service.idea.subscribe;

import net.feedbacky.app.data.user.dto.FetchUserDto;
import net.feedbacky.app.service.FeedbackyService;

import org.springframework.http.ResponseEntity;

/**
 * @author Plajer
 * <p>
 * Created at 28.05.2020
 */
public interface SubscriptionService extends FeedbackyService {

  FetchUserDto postSubscribe(long id);

  ResponseEntity deleteSubscribe(long id);

}
