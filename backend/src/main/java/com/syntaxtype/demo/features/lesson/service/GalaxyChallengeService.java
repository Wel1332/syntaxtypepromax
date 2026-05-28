package com.syntaxtype.demo.features.lesson.service;

import com.syntaxtype.demo.features.lesson.dto.GalaxyChallengeDTO;
import com.syntaxtype.demo.features.lesson.dto.GalaxyChallengePreview;
import com.syntaxtype.demo.features.lesson.entity.GalaxyChallenge;
import com.syntaxtype.demo.features.lesson.entity.galaxy.Choice;
import com.syntaxtype.demo.features.lesson.entity.galaxy.Question;
import com.syntaxtype.demo.features.lesson.repository.GalaxyChallengeRepository;


import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GalaxyChallengeService {

    private final GalaxyChallengeRepository repository;

    public GalaxyChallengeService(GalaxyChallengeRepository repository) {
        this.repository = repository;
    }

    public List<GalaxyChallengePreview> findAll() {
        return repository.findAll()
                .stream()
                .map(challenge -> new GalaxyChallengePreview(
                        challenge.getId(),
                        challenge.getTitle(),
                        challenge.getDescription()
                ))
                .collect(Collectors.toList());
    }

    public GalaxyChallengeDTO findByIdNoAnswer(Long id) {
        GalaxyChallenge challenge = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Galaxy Challenge not found"));

        GalaxyChallengeDTO dto = new GalaxyChallengeDTO();
        dto.setId(challenge.getId());
        dto.setTitle(challenge.getTitle());
        dto.setDescription(challenge.getDescription());

        List<GalaxyChallengeDTO.QuestionDTO> questionDTOs = challenge.getQuestions().stream()
                .map(question -> {
                    GalaxyChallengeDTO.QuestionDTO qdto = new GalaxyChallengeDTO.QuestionDTO();
                    qdto.setId(question.getId());
                    qdto.setQuestion(question.getQuestion());
                    qdto.setType(question.getType());

                    List<GalaxyChallengeDTO.ChoiceDTO> choiceDTOs = question.getChoices().stream()
                            .map(choice -> new GalaxyChallengeDTO.ChoiceDTO(
                                    choice.getChoice(),
                                    null // Exclude isCorrect (stripped by @JsonInclude(NON_NULL))
                            ))
                            .collect(Collectors.toList());
                    qdto.setChoices(choiceDTOs);

                    return qdto;
                })
                .collect(Collectors.toList());
        dto.setQuestions(questionDTOs);

        return dto;
    }

    public boolean checkifChoiceIsCorrect(Long challengeId, Long questionId, String choiceText) {
        GalaxyChallenge challenge = repository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Galaxy Challenge not found"));

        List<Question> questions = challenge.getQuestions();
        for (Question question : questions) {
            if (question.getId().equals(questionId)) {
                for (Choice choice : question.getChoices()) {
                    if (choice.getChoice().equals(choiceText)) {
                        return choice.isCorrect();
                    }
                }
            }
        }
        return false;
    }

    public boolean existsByTitle(String title) {
        return repository.existsByTitle(title);
    }


    public GalaxyChallenge save(GalaxyChallenge challenge) {
        return repository.save(challenge);
    }

    public GalaxyChallengePreview getPreviewById(Long id) {
        GalaxyChallenge challenge = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Galaxy Challenge not found"));

        return new GalaxyChallengePreview(
                challenge.getId(),
                challenge.getTitle(),
                challenge.getDescription()
        );
    }

    public boolean createGalaxyChallenge(GalaxyChallengeDTO dto) {
        try {
            GalaxyChallenge newChallenge = new GalaxyChallenge();
            newChallenge.setTitle(dto.getTitle());
            if(dto.getDescription() != null)newChallenge.setDescription(dto.getDescription());

            if (dto.getQuestions() != null) {
                List<Question> questions = mapQuestionsFromDTO(dto.getQuestions());
                newChallenge.setQuestions(questions);
            }

            repository.save(newChallenge);
        } catch (Exception e) {
            System.out.println("Error saving Galaxy Challenge: " + e.getMessage());
            return false;
        }
        return true;
    }

    public boolean updateGalaxyChallenge(Long id, GalaxyChallengeDTO challenge) {
        try{
            if (challenge == null || !id.equals(challenge.getId())) {
                return false;
            }

            GalaxyChallenge existing = repository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Galaxy Challenge not found"));
            
            existing.setTitle(challenge.getTitle());
            existing.setDescription(challenge.getDescription());
            existing.setQuestions(mapQuestionsFromDTO(challenge.getQuestions()));
            
            repository.save(existing);
            return true;
        } catch (Exception e) {
            System.out.println("Error updating Galaxy Challenge: " + e.getMessage());
            return false;
        }
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private List<Question> mapQuestionsFromDTO(List<GalaxyChallengeDTO.QuestionDTO> questionDTOs) {
        try{
            return questionDTOs.stream()
                .map(qdto -> {
                    Question question = new Question();
                    question.setQuestion(qdto.getQuestion());
                    question.setType(qdto.getType());
                    List<Choice> choices = qdto.getChoices().stream()
                            .map(cdto -> {
                                Choice choice = new Choice();
                                choice.setChoice(cdto.getChoice());
                                choice.setCorrect(Boolean.TRUE.equals(cdto.getIsCorrect()));
                                return choice;
                            })
                            .collect(Collectors.toList());
                    question.setChoices(choices);
                    return question;
                })
                .collect(Collectors.toList());
        } catch (Exception e) {
            System.out.println("Error mapping questions from DTO: " + e.getMessage());
            return List.of();
        }
        
    }
}