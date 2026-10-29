import { IsBoolean } from 'class-validator';

export class UpdateAiScanSettingsDto {
  @IsBoolean({
    message: 'autoAiScanEnabled phải là giá trị boolean (true/false)',
  })
  autoAiScanEnabled: boolean;
}
