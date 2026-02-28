import { gql } from "@apollo/client";

export const CREATE_PRESIGNED_UPLOADS_MUTATION = gql`
  mutation CreatePresignedUploads($input: CreatePresignedUploadsInput!) {
    createPresignedUploads(input: $input) {
      clientMutationId
      uploads {
        uploadId
        presignedUrl
      }
    }
  }
`;

export const COMPLETE_UPLOADS_MUTATION = gql`
  mutation CompleteUploads($input: CompleteUploadsInput!) {
    completeUploads(input: $input) {
      clientMutationId
      attachments {
        id
        url
        scope
        type
      }
    }
  }
`;

export const DELETE_ATTACHMENT_MUTATION = gql`
  mutation DeleteAttachment($input: DeleteAttachmentInput!) {
    deleteAttachment(input: $input) {
      clientMutationId
      deletedAttachmentId
    }
  }
`;
