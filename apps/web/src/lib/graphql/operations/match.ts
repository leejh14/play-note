import { gql } from "@apollo/client";

export const CREATE_MATCH_FROM_PRESET_MUTATION = gql`
  mutation CreateMatchFromPreset($input: CreateMatchFromPresetInput!) {
    createMatchFromPreset(input: $input) {
      clientMutationId
      match {
        id
        matchNo
      }
    }
  }
`;

export const SET_LANE_MUTATION = gql`
  mutation SetLane($input: SetLaneInput!) {
    setLane(input: $input) {
      clientMutationId
      match {
        id
      }
    }
  }
`;

export const SET_CHAMPION_MUTATION = gql`
  mutation SetChampion($input: SetChampionInput!) {
    setChampion(input: $input) {
      clientMutationId
      match {
        id
      }
    }
  }
`;

export const CONFIRM_MATCH_RESULT_MUTATION = gql`
  mutation ConfirmMatchResult($input: ConfirmMatchResultInput!) {
    confirmMatchResult(input: $input) {
      clientMutationId
      match {
        id
        winnerSide
        teamASide
        isConfirmed
      }
    }
  }
`;

export const DELETE_MATCH_MUTATION = gql`
  mutation DeleteMatch($input: DeleteMatchInput!) {
    deleteMatch(input: $input) {
      clientMutationId
      deletedMatchId
    }
  }
`;
