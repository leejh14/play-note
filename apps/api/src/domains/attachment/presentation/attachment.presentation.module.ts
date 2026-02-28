import { Module } from '@nestjs/common';
import { SharedPresentationModule } from '@shared/presentation/shared.presentation.module';
import { StorageModule } from '@shared/infrastructure/storage/storage.module';
import { AttachmentApplicationModule } from '@domains/attachment/application/attachment.application.module';
import { MatchApplicationModule } from '@domains/match/application/match.application.module';
import { AttachmentMutationResolver } from './resolvers/mutations/attachment.mutation.resolver';
import { AttachmentFieldResolver } from './resolvers/field-resolvers/attachment.field.resolver';
import '@domains/attachment/presentation/graphql/enums/attachment-scope.enum.gql';
import '@domains/attachment/presentation/graphql/enums/attachment-type.enum.gql';
import '@domains/attachment/presentation/graphql/enums/extraction-status.enum.gql';

@Module({
  imports: [
    SharedPresentationModule,
    StorageModule,
    AttachmentApplicationModule,
    MatchApplicationModule,
  ],
  providers: [AttachmentMutationResolver, AttachmentFieldResolver],
})
export class AttachmentPresentationModule {}
