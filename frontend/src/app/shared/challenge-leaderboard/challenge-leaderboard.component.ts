import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { ChallengeLeaderboardEntry } from "../../core/api/challenges-api.service";

@Component({
  selector: "app-challenge-leaderboard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./challenge-leaderboard.component.html",
  styleUrl: "./challenge-leaderboard.component.css",
})
export class ChallengeLeaderboardComponent {
  entries = input.required<ChallengeLeaderboardEntry[]>();
}
