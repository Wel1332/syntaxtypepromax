package com.syntaxtype.demo;

import com.syntaxtype.demo.features.lesson.dto.GalaxyChallengeDTO;
import com.syntaxtype.demo.features.lesson.dto.GalaxyChallengeDTO.QuestionDTO;
import com.syntaxtype.demo.features.user.dto.UserDTO;
import com.syntaxtype.demo.features.lesson.entity.galaxy.QuestionTypes;
import com.syntaxtype.demo.features.lesson.service.GalaxyChallengeService;
import com.syntaxtype.demo.features.user.service.UserService;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class DemoApplication {

	@Value("${admin.username}")
	private String adminUsername;

	@Value("${admin.email}")
	private String adminEmail;

	@Value("${admin.password}")
	private String adminPassword;

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@Bean
	public CommandLineRunner createAdminUser(UserService userService) {
		return args -> {
			// Check if the admin user already exists
			if (!userService.existsByUsername(adminUsername)) {
				System.out.println("Creating default admin user...");

				UserDTO adminUserDTO = UserDTO.builder()
						.username(adminUsername)
						.email(adminEmail)
						.password(adminPassword)
						.build();

				userService.saveUserWithAdminRole(adminUserDTO);
				System.out.println("Default admin user created successfully!");
			} else {
				System.out.println("Admin user already exists. Skipping creation.");
			}
		};
	}

	@Bean
	public CommandLineRunner createGalaxyChallenge(GalaxyChallengeService galaxyChallengeService) {
		QuestionDTO q1 = new QuestionDTO();
		q1.setQuestion("which syntax is used to print out text in C?");
		q1.setType(QuestionTypes.MULTIPLE_CHOICE);
		q1.setChoices(List.of(
			new GalaxyChallengeDTO.ChoiceDTO("cout", false),
			new GalaxyChallengeDTO.ChoiceDTO("printf()", true),
			new GalaxyChallengeDTO.ChoiceDTO("console.log()", false),
			new GalaxyChallengeDTO.ChoiceDTO("System.out.println()", false)
		));

		QuestionDTO q2 = new QuestionDTO();
		q2.setQuestion("--------- number = 10;\n What data type is missing?");
		q2.setType(QuestionTypes.FILL_IN_THE_BLANK);
		q2.setChoices(List.of(
			new GalaxyChallengeDTO.ChoiceDTO("int", true),
			new GalaxyChallengeDTO.ChoiceDTO("float", false),
			new GalaxyChallengeDTO.ChoiceDTO("double", false),
			new GalaxyChallengeDTO.ChoiceDTO("char", false)
		));
		
		GalaxyChallengeDTO dto = new GalaxyChallengeDTO();
		dto.setQuestions(List.of(q1, q2));
		dto.setTitle("Test Galaxy");
		
		return args -> {
			if(!galaxyChallengeService.existsByTitle(dto.getTitle())) {
				boolean success = galaxyChallengeService.createGalaxyChallenge(dto);
				if(success) System.out.println("Galaxy Challenge created successfully!");
				else {
					System.out.println("Failed to create Galaxy Challenge.");
				}
			} else System.out.println("Galaxy Challenge already exists. Skipping creation.");
		};
	}
}
