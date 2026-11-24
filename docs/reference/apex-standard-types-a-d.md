# Apex 標準型一覧：A–D（ConnectApi を除く）

[一覧の目次と調査条件](./apex-standard-types.md) / [公式 PDF](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf)

PDF ページは PDF ビューアーのページ番号（本文に印刷された番号とは異なる）。掲載は利用可能性を保証しない。

## ApexPages

[名前空間の説明（PDF 35 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=35)。

| 完全修飾名                                            | 種別   | PDF ページ | 備考 |
| ----------------------------------------------------- | ------ | ---------: | ---- |
| `ApexPages.Action`                                    | クラス |         36 | —    |
| `ApexPages.Component`                                 | クラス |         37 | —    |
| `ApexPages.IdeaStandardController`                    | クラス |         39 | —    |
| `ApexPages.IdeaStandardSetController`                 | クラス |         41 | —    |
| `ApexPages.KnowledgeArticleVersionStandardController` | クラス |         45 | —    |
| `ApexPages.Message`                                   | クラス |         48 | —    |
| `ApexPages.StandardController`                        | クラス |         52 | —    |
| `ApexPages.StandardSetController`                     | クラス |         57 | —    |

## AppLauncher

[名前空間の説明（PDF 67 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=67)。

| 完全修飾名                                | 種別   | PDF ページ | 備考 |
| ----------------------------------------- | ------ | ---------: | ---- |
| `AppLauncher.AppMenu`                     | クラス |         68 | —    |
| `AppLauncher.ChangePasswordController`    | クラス |         70 | —    |
| `AppLauncher.CommunityLogoController`     | クラス |         70 | —    |
| `AppLauncher.EmployeeLoginLinkController` | クラス |         70 | —    |
| `AppLauncher.ForgotPasswordController`    | クラス |         70 | —    |
| `AppLauncher.IdentityHeaderController`    | クラス |         70 | —    |
| `AppLauncher.LoginFormController`         | クラス |         71 | —    |
| `AppLauncher.SelfRegisterController`      | クラス |         71 | —    |
| `AppLauncher.SocialLoginController`       | クラス |         71 | —    |

## Approval

[名前空間の説明（PDF 71 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=71)。

| 完全修飾名                        | 種別   | PDF ページ | 備考 |
| --------------------------------- | ------ | ---------: | ---- |
| `Approval.LockResult`             | クラス |         72 | —    |
| `Approval.ProcessRequest`         | クラス |         74 | —    |
| `Approval.ProcessResult`          | クラス |         76 | —    |
| `Approval.ProcessSubmitRequest`   | クラス |         78 | —    |
| `Approval.ProcessWorkitemRequest` | クラス |         82 | —    |
| `Approval.UnlockResult`           | クラス |         83 | —    |

## Auth

[名前空間の説明（PDF 86 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=86)。

| 完全修飾名                                  | 種別             | PDF ページ | 備考 |
| ------------------------------------------- | ---------------- | ---------: | ---- |
| `Auth.AuthConfiguration`                    | クラス           |         89 | —    |
| `Auth.AuthProviderCallbackState`            | クラス           |        100 | —    |
| `Auth.AuthProviderPlugin`                   | インターフェース |        102 | —    |
| `Auth.AuthProviderPluginClass`              | クラス           |        106 | —    |
| `Auth.AuthProviderPluginException`          | 例外             |        246 | —    |
| `Auth.AuthProviderTokenResponse`            | クラス           |        115 | —    |
| `Auth.AuthToken`                            | クラス           |        118 | —    |
| `Auth.CommunitiesUtil`                      | クラス           |        124 | —    |
| `Auth.ConfigurableSelfRegHandler`           | インターフェース |        125 | —    |
| `Auth.ConfirmUserRegistrationHandler`       | インターフェース |        130 | —    |
| `Auth.ConnectedAppPlugin`                   | クラス           |        133 | —    |
| `Auth.CustomOneTimePasswordDeliveryHandler` | インターフェース |        140 | —    |
| `Auth.CustomOneTimePasswordDeliveryResult`  | enum             |        142 | —    |
| `Auth.DiscoveryCustomErrorException`        | 例外             |        246 | —    |
| `Auth.ExternalClientAppOauthHandler`        | クラス           |        143 | —    |
| `Auth.GeneratedUserData`                    | クラス           |        146 | —    |
| `Auth.HeadlessSelfRegistrationHandler`      | インターフェース |        151 | —    |
| `Auth.HeadlessUserDiscoveryHandler`         | インターフェース |        154 | —    |
| `Auth.HeadlessUserDiscoveryResponse`        | クラス           |        159 | —    |
| `Auth.HttpCalloutMockUtil`                  | クラス           |        160 | —    |
| `Auth.IntegratingAppType`                   | enum             |        162 | —    |
| `Auth.InvocationContext`                    | enum             |        162 | —    |
| `Auth.JsonValueOutput`                      | クラス           |        163 | —    |
| `Auth.JWS`                                  | クラス           |        166 | —    |
| `Auth.JWT`                                  | クラス           |        169 | —    |
| `Auth.JWTBearerTokenExchange`               | クラス           |        175 | —    |
| `Auth.JWTBearerTokenExchangeException`      | 例外             |        247 | —    |
| `Auth.JWTUtil`                              | クラス           |        180 | —    |
| `Auth.JWTValidationException`               | 例外             |        247 | —    |
| `Auth.LightningLoginEligibility`            | enum             |        184 | —    |
| `Auth.LoginDiscoveryException`              | 例外             |        247 | —    |
| `Auth.LoginDiscoveryHandler`                | インターフェース |        185 | —    |
| `Auth.LoginDiscoveryMethod`                 | enum             |        192 | —    |
| `Auth.MyDomainLoginDiscoveryHandler`        | インターフェース |        193 | —    |
| `Auth.Oauth2TokenExchangeHandler`           | クラス           |        197 | —    |
| `Auth.OAuth2TokenExchangeType`              | enum             |        199 | —    |
| `Auth.OAuthRefreshResult`                   | クラス           |        200 | —    |
| `Auth.OauthToken`                           | クラス           |        203 | —    |
| `Auth.OauthTokenType`                       | enum             |        204 | —    |
| `Auth.RegistrationHandler`                  | インターフェース |        204 | —    |
| `Auth.SamlJitHandler`                       | インターフェース |        210 | —    |
| `Auth.SessionLevel`                         | enum             |        226 | —    |
| `Auth.SessionManagement`                    | クラス           |        214 | —    |
| `Auth.TokenValidationResult`                | クラス           |        227 | —    |
| `Auth.UserData`                             | クラス           |        234 | —    |
| `Auth.VerificationAction`                   | enum             |        242 | —    |
| `Auth.VerificationException`                | 例外             |        247 | —    |
| `Auth.VerificationMethod`                   | enum             |        242 | —    |
| `Auth.VerificationPolicy`                   | enum             |        243 | —    |
| `Auth.VerificationResult`                   | クラス           |        243 | —    |

## Cache

[名前空間の説明（PDF 248 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=248)。

| 完全修飾名                                     | 種別             | PDF ページ | 備考 |
| ---------------------------------------------- | ---------------- | ---------: | ---- |
| `Cache.BulkApiKeysLimitExceededException`      | 例外             |        307 | —    |
| `Cache.CacheBuilder`                           | インターフェース |        249 | —    |
| `Cache.CacheBuilderExecutionException`         | 例外             |        307 | —    |
| `Cache.InvalidCacheBuilderException`           | 例外             |        307 | —    |
| `Cache.InvalidParamException`                  | 例外             |        307 | —    |
| `Cache.ItemSizeLimitExceededException`         | 例外             |        307 | —    |
| `Cache.Org`                                    | クラス           |        250 | —    |
| `Cache.Org.OrgCacheException`                  | 例外             |        307 | —    |
| `Cache.OrgPartition`                           | クラス           |        268 | —    |
| `Cache.Partition`                              | クラス           |        271 | —    |
| `Cache.PlatformCacheInvalidOperationException` | 例外             |        307 | —    |
| `Cache.Session`                                | クラス           |        287 | —    |
| `Cache.Session.SessionCacheException`          | 例外             |        306 | —    |
| `Cache.Session.SessionCacheNoSessionException` | 例外             |        306 | —    |
| `Cache.SessionPartition`                       | クラス           |        303 | —    |
| `Cache.Visibility`                             | enum             |        307 | —    |

## Canvas

[名前空間の説明（PDF 308 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=308)。

| 完全修飾名                      | 種別             | PDF ページ | 備考 |
| ------------------------------- | ---------------- | ---------: | ---- |
| `Canvas.ApplicationContext`     | インターフェース |        308 | —    |
| `Canvas.CanvasLifecycleHandler` | インターフェース |        312 | —    |
| `Canvas.CanvasRenderException`  | 例外             |        327 | —    |
| `Canvas.ContextTypeEnum`        | enum             |        314 | —    |
| `Canvas.EnvironmentContext`     | インターフェース |        315 | —    |
| `Canvas.RenderContext`          | インターフェース |        321 | —    |
| `Canvas.Test`                   | クラス           |        323 | —    |

## ChatterAnswers

[名前空間の説明（PDF 328 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=328)。

| 完全修飾名                      | 種別             | PDF ページ | 備考 |
| ------------------------------- | ---------------- | ---------: | ---- |
| `ChatterAnswers.AccountCreator` | インターフェース |        328 | —    |

## CommerceBuyGrp

[名前空間の説明（PDF 330 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=330)。

| 完全修飾名                                   | 種別   | PDF ページ | 備考 |
| -------------------------------------------- | ------ | ---------: | ---- |
| `CommerceBuyGrp.BuyerGroupEvaluationService` | クラス |        330 | —    |
| `CommerceBuyGrp.BuyerGroupRequest`           | クラス |        332 | —    |
| `CommerceBuyGrp.BuyerGroupResponse`          | クラス |        333 | —    |

## CommerceExtension

[名前空間の説明（PDF 336 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=336)。

| 完全修飾名                              | 種別             | PDF ページ | 備考 |
| --------------------------------------- | ---------------- | ---------: | ---- |
| `CommerceExtension.ExtensionInfo`       | クラス           |        336 | —    |
| `CommerceExtension.Resolution`          | クラス           |        339 | —    |
| `CommerceExtension.ResolutionException` | クラス           |        341 | —    |
| `CommerceExtension.ResolutionStates`    | enum             |        343 | —    |
| `CommerceExtension.ResolutionStrategy`  | インターフェース |        344 | —    |

## CommerceOrders

[名前空間の説明（PDF 346 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=346)。 この名前空間の PDF しおりには個別型がなく、本文から確認できた名前のみ。

型名はこの資料からは収録していない。型が存在しないという意味ではない。

## CommercePayments

[名前空間の説明（PDF 346 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=346)。

| 完全修飾名                                           | 種別             | PDF ページ | 備考 |
| ---------------------------------------------------- | ---------------- | ---------: | ---- |
| `CommercePayments.AbstractResponse`                  | クラス           |        350 | —    |
| `CommercePayments.AbstractTransactionResponse`       | クラス           |        354 | —    |
| `CommercePayments.AccountHolderType`                 | enum             |        359 | —    |
| `CommercePayments.AccountType`                       | enum             |        358 | —    |
| `CommercePayments.AddressRequest`                    | クラス           |        359 | —    |
| `CommercePayments.AlternativePaymentMethodRequest`   | クラス           |        363 | —    |
| `CommercePayments.AlternativePaymentMethodResponse`  | クラス           |        367 | —    |
| `CommercePayments.AuditParamsRequest`                | クラス           |        371 | —    |
| `CommercePayments.AuthApiPaymentMethodRequest`       | クラス           |        373 | —    |
| `CommercePayments.AuthorizationRequest`              | クラス           |        374 | —    |
| `CommercePayments.AuthorizationResponse`             | クラス           |        380 | —    |
| `CommercePayments.AuthorizationReversalRequest`      | クラス           |        387 | —    |
| `CommercePayments.AuthorizationReversalResponse`     | クラス           |        391 | —    |
| `CommercePayments.BankPaymentMethodRequest`          | クラス           |        396 | —    |
| `CommercePayments.BankPaymentMethodResponse`         | クラス           |        404 | —    |
| `CommercePayments.BankType`                          | enum             |        396 | —    |
| `CommercePayments.BaseApiPaymentMethodRequest`       | クラス           |        410 | —    |
| `CommercePayments.BaseNotification`                  | クラス           |        413 | —    |
| `CommercePayments.BasePaymentMethodRequest`          | クラス           |        419 | —    |
| `CommercePayments.BaseRequest`                       | クラス           |        420 | —    |
| `CommercePayments.CaptureNotification`               | クラス           |        421 | —    |
| `CommercePayments.CaptureRequest`                    | クラス           |        426 | —    |
| `CommercePayments.CaptureResponse`                   | クラス           |        428 | —    |
| `CommercePayments.CardCategory`                      | enum             |        433 | —    |
| `CommercePayments.CardPaymentMethodRequest`          | クラス           |        433 | —    |
| `CommercePayments.CardPaymentMethodResponse`         | クラス           |        440 | —    |
| `CommercePayments.CardType`                          | enum             |        447 | —    |
| `CommercePayments.CustomMetadataTypeInfo`            | クラス           |        447 | —    |
| `CommercePayments.EnhancedPaymentDataInput`          | クラス           |        448 | —    |
| `CommercePayments.GatewayErrorResponse`              | クラス           |        453 | —    |
| `CommercePayments.GatewayNotificationResponse`       | クラス           |        455 | —    |
| `CommercePayments.GatewayResponse`                   | インターフェース |        457 | —    |
| `CommercePayments.LineItemInput`                     | クラス           |        472 | —    |
| `CommercePayments.NotificationClient`                | クラス           |        458 | —    |
| `CommercePayments.NotificationSaveResult`            | クラス           |        460 | —    |
| `CommercePayments.NotificationStatus`                | enum             |        461 | —    |
| `CommercePayments.PaymentGatewayAdapter`             | インターフェース |        462 | —    |
| `CommercePayments.PaymentGatewayAsyncAdapter`        | インターフェース |        462 | —    |
| `CommercePayments.PaymentGatewayContext`             | クラス           |        465 | —    |
| `CommercePayments.PaymentGatewayNotificationContext` | クラス           |        467 | —    |
| `CommercePayments.PaymentGatewayNotificationRequest` | クラス           |        468 | —    |
| `CommercePayments.PaymentMethodDetailsResponse`      | クラス           |        470 | —    |
| `CommercePayments.PaymentMethodIdType`               | enum             |        478 | —    |
| `CommercePayments.PaymentMethodTokenizationRequest`  | クラス           |        478 | —    |
| `CommercePayments.PaymentMethodTokenizationResponse` | クラス           |        483 | —    |
| `CommercePayments.PaymentsHttp`                      | クラス           |        492 | —    |
| `CommercePayments.PostAuthApiPaymentMethodRequest`   | クラス           |        493 | —    |
| `CommercePayments.PostAuthorizationRequest`          | クラス           |        496 | —    |
| `CommercePayments.PostAuthorizationResponse`         | クラス           |        498 | —    |
| `CommercePayments.ReferencedRefundNotification`      | クラス           |        505 | —    |
| `CommercePayments.ReferencedRefundRequest`           | クラス           |        511 | —    |
| `CommercePayments.ReferencedRefundResponse`          | クラス           |        512 | —    |
| `CommercePayments.RefundRequest`                     | クラス           |        517 | —    |
| `CommercePayments.RequestType`                       | enum             |        518 | —    |
| `CommercePayments.RetryCategory`                     | enum             |        519 | —    |
| `CommercePayments.RetryDecision`                     | enum             |        519 | —    |
| `CommercePayments.SaleApiPaymentMethodRequest`       | クラス           |        519 | —    |
| `CommercePayments.SaleNotification`                  | クラス           |        523 | —    |
| `CommercePayments.SaleRequest`                       | クラス           |        529 | —    |
| `CommercePayments.SaleResponse`                      | クラス           |        539 | —    |
| `CommercePayments.SalesforceResultCode`              | enum             |        545 | —    |
| `CommercePayments.SalesforceResultCodeInfo`          | クラス           |        546 | —    |
| `CommercePayments.StandardEntryClassCode`            | enum             |        547 | —    |
| `CommercePayments.TokenizeNotification`              | クラス           |        548 | —    |

## CommerceTax

[名前空間の説明（PDF 555 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=555)。

| 完全修飾名                                | 種別             | PDF ページ | 備考 |
| ----------------------------------------- | ---------------- | ---------: | ---- |
| `CommerceTax.AbstractTransactionResponse` | クラス           |        557 | —    |
| `CommerceTax.AddressesResponse`           | クラス           |        563 | —    |
| `CommerceTax.AddressResponse`             | クラス           |        565 | —    |
| `CommerceTax.AmountDetailsResponse`       | クラス           |        566 | —    |
| `CommerceTax.CalculateTaxRequest`         | クラス           |        569 | —    |
| `CommerceTax.CalculateTaxResponse`        | クラス           |        573 | —    |
| `CommerceTax.CalculateTaxType`            | enum             |        581 | —    |
| `CommerceTax.CustomTaxAttributesResponse` | クラス           |        581 | —    |
| `CommerceTax.ErrorResponse`               | クラス           |        583 | —    |
| `CommerceTax.HeaderTaxAddressesRequest`   | クラス           |        584 | —    |
| `CommerceTax.ImpositionResponse`          | クラス           |        589 | —    |
| `CommerceTax.JurisdictionResponse`        | クラス           |        591 | —    |
| `CommerceTax.LineItemResponse`            | クラス           |        595 | —    |
| `CommerceTax.LineTaxAddressesRequest`     | クラス           |        601 | —    |
| `CommerceTax.RequestType`                 | enum             |        605 | —    |
| `CommerceTax.ResultCode`                  | enum             |        605 | —    |
| `CommerceTax.RuleDetailsResponse`         | クラス           |        605 | —    |
| `CommerceTax.TaxAddressesRequest`         | クラス           |        608 | —    |
| `CommerceTax.TaxAddressRequest`           | クラス           |        612 | —    |
| `CommerceTax.TaxApiException`             | クラス           |        617 | —    |
| `CommerceTax.TaxCustomerDetailsRequest`   | クラス           |        619 | —    |
| `CommerceTax.TaxDetailsResponse`          | クラス           |        623 | —    |
| `CommerceTax.TaxEngineAdapter`            | インターフェース |        630 | —    |
| `CommerceTax.TaxEngineContext`            | クラス           |        656 | —    |
| `CommerceTax.TaxLineItemRequest`          | クラス           |        659 | —    |
| `CommerceTax.TaxSellerDetailsRequest`     | クラス           |        665 | —    |
| `CommerceTax.TaxTransactionRequest`       | クラス           |        668 | —    |
| `CommerceTax.TaxTransactionStatus`        | enum             |        675 | —    |
| `CommerceTax.TaxTransactionType`          | enum             |        675 | —    |

## commonserviceexcellence

[名前空間の説明（PDF 676 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=676)。 この名前空間の PDF しおりには個別型がなく、本文から確認できた名前のみ。

| 完全修飾名                                   | 種別   | PDF ページ | 備考 |
| -------------------------------------------- | ------ | ---------: | ---- |
| `commonserviceexcellence.IntegrationHandler` | クラス |        676 | —    |

## ComplianceMgmt

[名前空間の説明（PDF 676 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=676)。 この名前空間の PDF しおりには個別型がなく、本文から確認できた名前のみ。

| 完全修飾名                                    | 種別             | PDF ページ | 備考 |
| --------------------------------------------- | ---------------- | ---------: | ---- |
| `ComplianceMgmt.ComplianceControlLog`         | クラス           |        676 | —    |
| `ComplianceMgmt.ComplianceEvaluation`         | インターフェース |        676 | —    |
| `ComplianceMgmt.ComplianceEvaluationResponse` | クラス           |        676 | —    |
| `ComplianceMgmt.ControlEvaluationInput`       | クラス           |        676 | —    |
| `ComplianceMgmt.ControlInput`                 | クラス           |        676 | —    |
| `ComplianceMgmt.EvaluationResult`             | クラス           |        676 | —    |

## Compression

[名前空間の説明（PDF 676 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=676)。

| 完全修飾名                 | 種別   | PDF ページ | 備考 |
| -------------------------- | ------ | ---------: | ---- |
| `Compression.Level`        | enum   |        677 | —    |
| `Compression.Method`       | enum   |        677 | —    |
| `Compression.ZipEntry`     | クラス |        678 | —    |
| `Compression.ZipException` | 例外   |        692 | —    |
| `Compression.ZipReader`    | クラス |        683 | —    |
| `Compression.ZipWriter`    | クラス |        686 | —    |

## Context

[名前空間の説明（PDF 2741 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=2741)。 この名前空間の PDF しおりには個別型がなく、本文から確認できた名前のみ。

| 完全修飾名                  | 種別   | PDF ページ | 備考 |
| --------------------------- | ------ | ---------: | ---- |
| `Context.IndustriesContext` | クラス |       2741 | —    |

## Database

[名前空間の説明（PDF 2741 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=2741)。

| 完全修飾名                                 | 種別             | PDF ページ | 備考 |
| ------------------------------------------ | ---------------- | ---------: | ---- |
| `Database.Batchable`                       | インターフェース |       2743 | —    |
| `Database.BatchableContext`                | インターフェース |       2745 | —    |
| `Database.Cursor`                          | クラス           |       2745 | —    |
| `Database.CursorFetchResult`               | クラス           |       2747 | —    |
| `Database.DeletedRecord`                   | クラス           |       2749 | —    |
| `Database.DeleteResult`                    | クラス           |       2750 | —    |
| `Database.DMLOptions`                      | クラス           |       2752 | —    |
| `Database.DmlOptions.AssignmentRuleHeader` | クラス           |       2755 | —    |
| `Database.DMLOptions.DuplicateRuleHeader`  | クラス           |       2756 | —    |
| `Database.DmlOptions.EmailHeader`          | クラス           |       2758 | —    |
| `Database.DuplicateError`                  | クラス           |       2761 | —    |
| `Database.EmptyRecycleBinResult`           | クラス           |       2763 | —    |
| `Database.Error`                           | クラス           |       2764 | —    |
| `Database.GetDeletedResult`                | クラス           |       2766 | —    |
| `Database.GetUpdatedResult`                | クラス           |       2767 | —    |
| `Database.LeadConvert`                     | クラス           |       2768 | —    |
| `Database.LeadConvertResult`               | クラス           |       2779 | —    |
| `Database.MergeResult`                     | クラス           |       2782 | —    |
| `Database.PaginationCursor`                | クラス           |       2784 | —    |
| `Database.QueryLocator`                    | クラス           |       2786 | —    |
| `Database.QueryLocatorIterator`            | クラス           |       2787 | —    |
| `Database.QueryOptions`                    | クラス           |       2788 | —    |
| `Database.QueryOptionsBuilder`             | クラス           |       2790 | —    |
| `Database.SaveResult`                      | クラス           |       2793 | —    |
| `Database.UndeleteResult`                  | クラス           |       2796 | —    |
| `Database.UpsertResult`                    | クラス           |       2797 | —    |

## Datacloud

[名前空間の説明（PDF 2799 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=2799)。

| 完全修飾名                           | 種別   | PDF ページ | 備考 |
| ------------------------------------ | ------ | ---------: | ---- |
| `Datacloud.AdditionalInformationMap` | クラス |       2799 | —    |
| `Datacloud.DuplicateResult`          | クラス |       2800 | —    |
| `Datacloud.FieldDiff`                | クラス |       2805 | —    |
| `Datacloud.FindDuplicates`           | クラス |       2807 | —    |
| `Datacloud.FindDuplicatesByIds`      | クラス |       2809 | —    |
| `Datacloud.FindDuplicatesResult`     | クラス |       2812 | —    |
| `Datacloud.MatchRecord`              | クラス |       2815 | —    |
| `Datacloud.MatchResult`              | クラス |       2816 | —    |

## DataRetrieval

[名前空間の説明（PDF 2819 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=2819)。 この名前空間の PDF しおりには個別型がなく、本文から確認できた名前のみ。

| 完全修飾名                                  | 種別   | PDF ページ | 備考 |
| ------------------------------------------- | ------ | ---------: | ---- |
| `DataRetrieval.Engagement`                  | クラス |       2819 | —    |
| `DataRetrieval.EngagementRecordDetails`     | クラス |       2819 | —    |
| `DataRetrieval.EngagementRecordDetailsList` | クラス |       2819 | —    |
| `DataRetrieval.Engagements`                 | クラス |       2819 | —    |
| `DataRetrieval.FieldDetailsRepresentation`  | クラス |       2819 | —    |
| `DataRetrieval.ObjectDetailsRepresentation` | クラス |       2819 | —    |
| `DataRetrieval.RecordDetailsRepresentation` | クラス |       2819 | —    |
| `DataRetrieval.RecordTranscripts`           | クラス |       2819 | —    |
| `DataRetrieval.RecordTranscriptsList`       | クラス |       2819 | —    |
| `DataRetrieval.Transcript`                  | クラス |       2819 | —    |

## DataSource

[名前空間の説明（PDF 2819 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=2819)。

| 完全修飾名                              | 種別   | PDF ページ | 備考 |
| --------------------------------------- | ------ | ---------: | ---- |
| `DataSource.AsyncDeleteCallback`        | クラス |       2821 | —    |
| `DataSource.AsyncSaveCallback`          | クラス |       2822 | —    |
| `DataSource.AuthenticationCapability`   | enum   |       2823 | —    |
| `DataSource.AuthenticationProtocol`     | enum   |       2824 | —    |
| `DataSource.Capability`                 | enum   |       2824 | —    |
| `DataSource.Column`                     | クラス |       2825 | —    |
| `DataSource.ColumnSelection`            | クラス |       2850 | —    |
| `DataSource.Connection`                 | クラス |       2851 | —    |
| `DataSource.ConnectionParams`           | クラス |       2857 | —    |
| `DataSource.DataSourceException`        | 例外   |       2900 | —    |
| `DataSource.DataSourceUtil`             | クラス |       2860 | —    |
| `DataSource.DataType`                   | enum   |       2862 | —    |
| `DataSource.DeleteContext`              | クラス |       2863 | —    |
| `DataSource.DeleteResult`               | クラス |       2864 | —    |
| `DataSource.Filter`                     | クラス |       2867 | —    |
| `DataSource.FilterType`                 | enum   |       2869 | —    |
| `DataSource.IdentityType`               | enum   |       2870 | —    |
| `DataSource.OAuthTokenExpiredException` | 例外   |       2900 | —    |
| `DataSource.Order`                      | クラス |       2870 | —    |
| `DataSource.OrderDirection`             | enum   |       2872 | —    |
| `DataSource.Provider`                   | クラス |       2873 | —    |
| `DataSource.QueryAggregation`           | enum   |       2875 | —    |
| `DataSource.QueryContext`               | クラス |       2875 | —    |
| `DataSource.QueryUtils`                 | クラス |       2877 | —    |
| `DataSource.ReadContext`                | クラス |       2880 | —    |
| `DataSource.SearchContext`              | クラス |       2881 | —    |
| `DataSource.SearchUtils`                | クラス |       2883 | —    |
| `DataSource.Table`                      | クラス |       2884 | —    |
| `DataSource.TableResult`                | クラス |       2889 | —    |
| `DataSource.TableSelection`             | クラス |       2894 | —    |
| `DataSource.UpsertContext`              | クラス |       2896 | —    |
| `DataSource.UpsertResult`               | クラス |       2897 | —    |

## DataWeave

[名前空間の説明（PDF 2900 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=2900)。

| 完全修飾名         | 種別   | PDF ページ | 備考 |
| ------------------ | ------ | ---------: | ---- |
| `DataWeave.Result` | クラス |       2901 | —    |
| `DataWeave.Script` | クラス |       2902 | —    |

## Dom

[名前空間の説明（PDF 2904 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=2904)。

| 完全修飾名        | 種別   | PDF ページ | 備考 |
| ----------------- | ------ | ---------: | ---- |
| `Dom.Document`    | クラス |       2905 | —    |
| `Dom.XmlNode`     | クラス |       2907 | —    |
| `Dom.XmlNodeType` | enum   |       2917 | —    |

## disputemanagement

[名前空間の説明（PDF 2953 ページ）](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/salesforce_apex_reference_guide.pdf#page=2953)。 この名前空間の PDF しおりには個別型がなく、本文から確認できた名前のみ。

| 完全修飾名                            | 種別   | PDF ページ | 備考 |
| ------------------------------------- | ------ | ---------: | ---- |
| `disputemanagement.DisputeMgmtHelper` | クラス |       2953 | —    |
