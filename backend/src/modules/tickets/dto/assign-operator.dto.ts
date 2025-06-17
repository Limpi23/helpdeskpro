import { IsString, IsNotEmpty } from 'class-validator';

export class AssignOperatorDto {
  @IsNotEmpty()
  @IsString()
  operadorId: string;
} 