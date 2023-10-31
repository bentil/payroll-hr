import {
  Body,
  Get,
  Path,
  Post,
  Queries,
  Response,
  Route,
  SuccessResponse,
  Tags,
  Request,
  Delete,
} from 'tsoa';
import { ApiErrorResponse, ApiSuccessResponse } from '../../domain/api-responses';
import * as compLevelLeavePackageService from '../../services/company-level-leave-package.service';
import { errors } from '../../utils/constants';
import { rootLogger } from '../../utils/logger';
import { Request as expressRequest } from 'express';
import {
  CreateCompanyLevelLeavePackageDto, CompanyLevelLeavePackageDto,
  QueryCompanyLevelLeavePackageDto
} from '../../domain/dto/company-level-leave-package.dto';


@Tags('Company Level Leave Packages')
@Route('/api/v1/company-level-leave-packages')
export class CompanyLevelLeavePackageV1Controller {
  private readonly logger = rootLogger.child({ 
    context: CompanyLevelLeavePackageV1Controller.name 
  });
  /**
  * Add Leave Package(s) to a Company Level
  * @param createData Request body
  * @returns CompanyLevelLeavePackage[]
  */
  @Post()
  @SuccessResponse(201, 'Created')
  public async addCompanyLevelLeavePackage(
    @Body() createData: CreateCompanyLevelLeavePackageDto,
    @Request() request: expressRequest
  ): Promise<ApiSuccessResponse<CompanyLevelLeavePackageDto[]>> {
    this.logger.debug('Received request to add company-level-leave-package');
    const companyLevelLeavePackage = await compLevelLeavePackageService.
      createCompanyLevelLeavePackage(createData, request.user);
    return { data: companyLevelLeavePackage };
  }
  /**
    * Get a list of company-level-leave-packages matching query
    * companyLevelId can be ordered by createdAt sort fields,
    * leavePackageId can be ordered by createdAt sort fields
    * @param query Query parameters, including pagination and ordering details
    * @returns List of matching company-level-leave-package
    */

  @Get()
  public async getCompanyLevelLeavePackages(
    @Queries() query: QueryCompanyLevelLeavePackageDto,
    //@Request() request: expressRequest
  ): Promise<ApiSuccessResponse<CompanyLevelLeavePackageDto[]>> {
    this.logger.info(
      'Received request to get company-level-leave-package matching query', { query }
    );
    const { data, pagination } = await compLevelLeavePackageService.
      getCompanyLevelLeavePackages(query/*, request.user*/);
    this.logger.info('Returning %d company-level-leave-package that matched query', data.length);
    return { data, pagination };
  }

  /**
      * Get a company-level-leave-package by ID
      * @param id company-level-leave-package ID
      * @returns CompanyLevelLeavePackage
      */
  @Get('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.NOT_FOUND,
    message: 'CompanyLevelLeavePackage does not exist',
    details: [],
  })
  public async getCompanyLevelLeavePackageById(
    @Path('id') id: number,
    //@Request() request: expressRequest
  ): Promise<ApiSuccessResponse<CompanyLevelLeavePackageDto>> {
    this.logger.info('Received request to get CompanyLevelLeavePackage[%s]', id);
    const companyLevelLeavePackage = await compLevelLeavePackageService.
      getCompanyLevelLeavePackageById(id/*, request.user*/);
    return { data: companyLevelLeavePackage };
  }


  /**
      * Delete a company-level-leave-package by ID
      * @param id company-level-leave-package ID
      * @returns empty body
      */
  @Delete('{id}')
  @Response<ApiErrorResponse>(404, 'Not Found', {
    error: errors.NOT_FOUND,
    message: 'CompanyLevelLeavePackage you are attempting to delete does not exist',
    details: [],
  })
  @SuccessResponse(204, 'No Content')
  public async deleteCompanyLevelLeavePackage(
    @Path('id') id: number,
    //@Request() request: expressRequest
  ): Promise<void> {
    this.logger.info('Received request to delete CompanyLevelLeavePackage[%s]', id);
    await compLevelLeavePackageService.deleteCompanyLevelLeavePackage(id/*, request.user*/);
  }

}