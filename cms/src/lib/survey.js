function getSurveyAnswerIds(survey) {
  if (!survey) return [];
  if (Array.isArray(survey.answerGameIds) && survey.answerGameIds.length) {
    return survey.answerGameIds.map((id) => Number(id));
  }
  if (survey.answerGameId != null && survey.answerGameId !== "") {
    return [Number(survey.answerGameId)];
  }
  return [];
}

function hasSurvey(survey) {
  return getSurveyAnswerIds(survey).length > 0;
}

module.exports = { getSurveyAnswerIds, hasSurvey };
