package com.syntaxtype.demo.features.gamecontent.repository;

import com.syntaxtype.demo.core.enums.ContentBank;
import com.syntaxtype.demo.core.enums.ContentGame;
import com.syntaxtype.demo.features.gamecontent.entity.GameContent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GameContentRepository extends JpaRepository<GameContent, Long> {

    /** What a player's game loads: active items only, in authored order. */
    List<GameContent> findByGameAndBankAndActiveTrueOrderByPositionAscContentIdAsc(
            ContentGame game, ContentBank bank);

    /** What the authoring screen lists: inactive items included. */
    List<GameContent> findByGameOrderByBankAscPositionAscContentIdAsc(ContentGame game);

    List<GameContent> findByGameAndActiveTrue(ContentGame game);

    /** Import idempotency — an item is identified by its original bank id within a game. */
    Optional<GameContent> findByGameAndBankAndExternalId(
            ContentGame game, ContentBank bank, String externalId);

    long countByGameAndBankAndActiveTrue(ContentGame game, ContentBank bank);
}
