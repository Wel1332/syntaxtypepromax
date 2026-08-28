package com.syntaxtype.demo.features.gamecontent.service;

import com.syntaxtype.demo.core.enums.ContentBank;
import com.syntaxtype.demo.core.enums.ContentGame;
import com.syntaxtype.demo.features.gamecontent.dto.GameContentDTO;
import com.syntaxtype.demo.features.gamecontent.entity.GameContent;
import com.syntaxtype.demo.features.gamecontent.repository.GameContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GameContentService {

    private final GameContentRepository repository;

    public List<GameContentDTO> findForPlay(ContentGame game, ContentBank bank) {
        return repository
                .findByGameAndBankAndActiveTrueOrderByPositionAscContentIdAsc(game, bank)
                .stream().map(this::toDTO).toList();
    }

    public List<GameContentDTO> findForAuthoring(ContentGame game) {
        return repository.findByGameOrderByBankAscPositionAscContentIdAsc(game)
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public GameContentDTO create(GameContentDTO dto) {
        return toDTO(repository.save(fromDTO(dto, new GameContent())));
    }

    @Transactional
    public GameContentDTO update(Long contentId, GameContentDTO dto) {
        GameContent existing = repository.findById(contentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Content not found."));
        return toDTO(repository.save(fromDTO(dto, existing)));
    }

    /**
     * Soft delete. A hard delete during data collection would silently change
     * what later participants are assessed on, with nothing left to show the
     * item ever existed.
     */
    @Transactional
    public void deactivate(Long contentId) {
        GameContent existing = repository.findById(contentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Content not found."));
        existing.setActive(false);
        repository.save(existing);
    }

    /**
     * Bulk import, used once to lift the built-in banks out of the frontend
     * bundle and into the database.
     *
     * Idempotent on (game, bank, externalId): re-importing updates the existing
     * row rather than duplicating it, so a faculty member who runs the import
     * twice does not end up with every drill listed twice. Items already edited
     * keep their edits unless overwrite is set.
     */
    @Transactional
    public int importBatch(List<GameContentDTO> items, boolean overwrite) {
        int written = 0;
        for (GameContentDTO dto : items) {
            var existing = (dto.getExternalId() == null) ? java.util.Optional.<GameContent>empty()
                    : repository.findByGameAndBankAndExternalId(dto.getGame(), dto.getBank(), dto.getExternalId());

            if (existing.isPresent() && !overwrite) continue;

            GameContent target = existing.orElseGet(GameContent::new);
            repository.save(fromDTO(dto, target));
            written++;
        }
        return written;
    }

    public long countActive(ContentGame game, ContentBank bank) {
        return repository.countByGameAndBankAndActiveTrue(game, bank);
    }

    private GameContent fromDTO(GameContentDTO dto, GameContent target) {
        if (dto.getGame() == null || dto.getBank() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "game and bank are required.");
        }
        if (dto.getPayload() == null || dto.getPayload().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "payload is required.");
        }
        // contentId is deliberately not copied from the DTO. Mapping a
        // client-supplied identifier onto a new entity is what let registration
        // overwrite arbitrary accounts; the same mistake here would let an
        // author overwrite an unrelated item by guessing its id.
        target.setGame(dto.getGame());
        target.setBank(dto.getBank());
        target.setItemType(dto.getItemType() == null ? "ITEM" : dto.getItemType());
        target.setExternalId(dto.getExternalId());
        target.setTopic(dto.getTopic());
        target.setDifficulty(dto.getDifficulty());
        target.setPayload(dto.getPayload());
        target.setActive(dto.getActive() == null || dto.getActive());
        target.setPosition(dto.getPosition());
        return target;
    }

    private GameContentDTO toDTO(GameContent c) {
        return GameContentDTO.builder()
                .contentId(c.getContentId())
                .game(c.getGame())
                .bank(c.getBank())
                .itemType(c.getItemType())
                .externalId(c.getExternalId())
                .topic(c.getTopic())
                .difficulty(c.getDifficulty())
                .payload(c.getPayload())
                .active(c.isActive())
                .position(c.getPosition())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
