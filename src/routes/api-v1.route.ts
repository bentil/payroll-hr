import { Router } from 'express';
import { validateRequestBody, validateRequestQuery } from '../middleware/request-validations';
import { 
  CREATE_GRIEVANCE_TYPE_SCHEMA, 
  QUERY_GRIEVANCE_TYPE_SCHEMA, 
  SEARCH_GRIEVANCE_TYPE_SCHEMA,
  UPDATE_GRIEVANCE_TYPE_SCHEMA
} from '../domain/request-schema/grievance-type.schema';
import * as grievanceTypeV1Controller from '../controllers/grievance-type-v1.api.controller';

const router = Router();

// ### GRIEVANCE TYPE ROUTES

router.post(
  '/grievance-types',
  validateRequestBody(CREATE_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.addNewGrievanceType
);

router.get(
  '/grievance-types',
  validateRequestQuery(QUERY_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.getGrievanceTypes
);

router.get(
  '/grievance-types/search',
  validateRequestQuery(SEARCH_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.searchGrievanceTypes
);

router.get(
  '/grievance-tyeps/:id',
  grievanceTypeV1Controller.getGrievanceType
);

router.patch(
  '/grievance-tyeps/:id',
  validateRequestBody(UPDATE_GRIEVANCE_TYPE_SCHEMA),
  grievanceTypeV1Controller.updateGrievanceType
);

router.delete(
  '/grievance-tyeps/:id',
  grievanceTypeV1Controller.deleteGrievanceType
);

export default router;
